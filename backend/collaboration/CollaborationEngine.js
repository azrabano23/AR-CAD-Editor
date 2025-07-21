const express = require('express');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

/**
 * HoloDraft Collaboration Engine
 * GitHub-style collaboration system for AR/VR data visualization
 * Supports project management, branching, merging, and real-time collaboration
 */
class CollaborationEngine {
    constructor() {
        this.projects = new Map();
        this.sessions = new Map();
        this.users = new Map();
        this.repositories = new Map();
        this.branches = new Map();
        this.commits = new Map();
        this.pullRequests = new Map();
        
        // Authentication and user management
        this.userProfiles = new Map();
        this.userSessions = new Map();
        this.blockedUsers = new Map(); // userId -> Set of blocked userIds
        this.collaborationRequests = new Map();
        this.notifications = new Map();
        
        // WebSocket server for real-time collaboration
        this.wss = null;
        
        // Email transporter
        this.emailTransporter = this.setupEmailService();
        
        // JWT secret
        this.jwtSecret = process.env.JWT_SECRET || 'holodraft-secret-key-2024';
        
        // Performance metrics
        this.metrics = {
            activeUsers: 0,
            activeSessions: 0,
            totalProjects: 0,
            totalCommits: 0,
            lastUpdate: new Date()
        };
        
        this.initializeServer();
    }
    
    setupEmailService() {
        return nodemailer.createTransporter({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }
    
    initializeServer() {
        const app = express();
        app.use(express.json({ limit: '50mb' }));
        app.use(express.urlencoded({ extended: true, limit: '50mb' }));
        
        // Enable CORS
        app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
            if (req.method === 'OPTIONS') {
                res.sendStatus(200);
            } else {
                next();
            }
        });
        
        this.setupRoutes(app);
        
        const server = app.listen(process.env.PORT || 5001, () => {
            console.log(`🚀 HoloDraft Collaboration Engine running on port ${server.address().port}`);
        });
        
        // WebSocket server for real-time collaboration
        this.wss = new WebSocket.Server({ server });
        this.setupWebSocketHandlers();
    }
    
    setupRoutes(app) {
        // Security middleware
        app.use(helmet());
        
        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100 // limit each IP to 100 requests per windowMs
        });
        app.use('/api/', limiter);
        
        // Authentication routes
        app.post('/api/auth/register', this.registerUser.bind(this));
        app.post('/api/auth/login', this.loginUser.bind(this));
        app.post('/api/auth/logout', this.authenticateToken.bind(this), this.logoutUser.bind(this));
        app.post('/api/auth/refresh', this.refreshToken.bind(this));
        app.post('/api/auth/verify-email', this.verifyEmail.bind(this));
        app.post('/api/auth/forgot-password', this.forgotPassword.bind(this));
        app.post('/api/auth/reset-password', this.resetPassword.bind(this));
        
        // User Management (Enhanced)
        app.get('/api/users/profile/:userId', this.getUserProfile.bind(this));
        app.put('/api/users/profile/:userId', this.authenticateToken.bind(this), this.updateUserProfile.bind(this));
        app.post('/api/users/block', this.authenticateToken.bind(this), this.blockUser.bind(this));
        app.post('/api/users/unblock', this.authenticateToken.bind(this), this.unblockUser.bind(this));
        app.get('/api/users/blocked/:userId', this.authenticateToken.bind(this), this.getBlockedUsers.bind(this));
        app.get('/api/users/search', this.searchUsers.bind(this));
        
        // Collaboration & Permissions
        app.post('/api/repositories/:repoId/collaborators', this.authenticateToken.bind(this), this.addCollaborator.bind(this));
        app.delete('/api/repositories/:repoId/collaborators/:userId', this.authenticateToken.bind(this), this.removeCollaborator.bind(this));
        app.get('/api/repositories/:repoId/permissions/:userId', this.checkRepositoryPermission.bind(this));
        app.post('/api/repositories/:repoId/invite', this.authenticateToken.bind(this), this.inviteCollaborator.bind(this));
        app.post('/api/collaboration-requests/:requestId/accept', this.authenticateToken.bind(this), this.acceptCollaborationRequest.bind(this));
        app.post('/api/collaboration-requests/:requestId/reject', this.authenticateToken.bind(this), this.rejectCollaborationRequest.bind(this));
        
        // Notifications
        app.get('/api/notifications/:userId', this.authenticateToken.bind(this), this.getNotifications.bind(this));
        app.put('/api/notifications/:notificationId/read', this.authenticateToken.bind(this), this.markNotificationRead.bind(this));
        app.delete('/api/notifications/:notificationId', this.authenticateToken.bind(this), this.deleteNotification.bind(this));
        
        // Repository Management (GitHub-style) - Now with auth
        app.post('/api/repositories', this.authenticateToken.bind(this), this.createRepository.bind(this));
        app.get('/api/repositories', this.listRepositories.bind(this));
        app.get('/api/repositories/:repoId', this.getRepository.bind(this));
        app.delete('/api/repositories/:repoId', this.authenticateToken.bind(this), this.deleteRepository.bind(this));
        app.post('/api/repositories/:repoId/fork', this.authenticateToken.bind(this), this.forkRepository.bind(this));
        
        // Branch Management - Now with auth
        app.get('/api/repositories/:repoId/branches', this.getBranches.bind(this));
        app.post('/api/repositories/:repoId/branches', this.authenticateToken.bind(this), this.createBranch.bind(this));
        app.delete('/api/repositories/:repoId/branches/:branchName', this.authenticateToken.bind(this), this.deleteBranch.bind(this));
        app.post('/api/repositories/:repoId/branches/:branchName/merge', this.authenticateToken.bind(this), this.mergeBranch.bind(this));
        
        // Commit Management - Now with auth
        app.get('/api/repositories/:repoId/commits', this.getCommits.bind(this));
        app.post('/api/repositories/:repoId/commits', this.authenticateToken.bind(this), this.createCommit.bind(this));
        app.get('/api/repositories/:repoId/commits/:commitId', this.getCommit.bind(this));
        
        // Pull Requests - Now with auth
        app.get('/api/repositories/:repoId/pulls', this.getPullRequests.bind(this));
        app.post('/api/repositories/:repoId/pulls', this.authenticateToken.bind(this), this.createPullRequest.bind(this));
        app.put('/api/repositories/:repoId/pulls/:pullId', this.authenticateToken.bind(this), this.updatePullRequest.bind(this));
        
        // AR Session Management - Now with auth
        app.post('/api/sessions', this.authenticateToken.bind(this), this.createARSession.bind(this));
        app.get('/api/sessions', this.listARSessions.bind(this));
        app.get('/api/sessions/:sessionId', this.getARSession.bind(this));
        app.post('/api/sessions/:sessionId/join', this.authenticateToken.bind(this), this.joinARSession.bind(this));
        app.post('/api/sessions/:sessionId/leave', this.authenticateToken.bind(this), this.leaveARSession.bind(this));
        
        // User Management (Legacy - keeping for backward compatibility)
        app.post('/api/users', this.createUser.bind(this));
        app.get('/api/users/:userId', this.getUser.bind(this));
        app.put('/api/users/:userId', this.updateUser.bind(this));
        
        // File Management - Now with auth
        app.post('/api/repositories/:repoId/files', this.authenticateToken.bind(this), this.uploadFile.bind(this));
        app.get('/api/repositories/:repoId/files', this.listFiles.bind(this));
        app.delete('/api/repositories/:repoId/files/:fileId', this.authenticateToken.bind(this), this.deleteFile.bind(this));
        
        // Performance and Analytics
        app.get('/api/metrics', this.getMetrics.bind(this));
        app.get('/api/health', this.healthCheck.bind(this));
    }
    
    setupWebSocketHandlers() {
        this.wss.on('connection', (ws, req) => {
            console.log('🔗 New WebSocket connection established');
            
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.handleWebSocketMessage(ws, message);
                } catch (error) {
                    console.error('❌ WebSocket message parsing error:', error);
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Invalid message format'
                    }));
                }
            });
            
            ws.on('close', () => {
                this.handleUserDisconnect(ws);
            });
            
            ws.on('error', (error) => {
                console.error('❌ WebSocket error:', error);
            });
        });
    }
    
    async handleWebSocketMessage(ws, message) {
        const { type, payload } = message;
        
        switch (type) {
            case 'join_session':
                await this.handleJoinSession(ws, payload);
                break;
                
            case 'leave_session':
                await this.handleLeaveSession(ws, payload);
                break;
                
            case 'ar_transform':
                await this.broadcastARTransform(ws, payload);
                break;
                
            case 'ar_annotation':
                await this.broadcastARAnnotation(ws, payload);
                break;
                
            case 'voice_chat':
                await this.broadcastVoiceChat(ws, payload);
                break;
                
            case 'screen_share':
                await this.broadcastScreenShare(ws, payload);
                break;
                
            case 'model_update':
                await this.handleModelUpdate(ws, payload);
                break;
                
            case 'commit_changes':
                await this.handleCommitChanges(ws, payload);
                break;
                
            default:
                ws.send(JSON.stringify({
                    type: 'error',
                    message: `Unknown message type: ${type}`
                }));
        }
    }
    
    // Repository Management (GitHub-style)
    async createRepository(req, res) {
        try {
            const { name, description, isPrivate = false, ownerId } = req.body;
            
            if (!name || !ownerId) {
                return res.status(400).json({ error: 'Name and owner ID are required' });
            }
            
            const repoId = uuidv4();
            const repository = {
                id: repoId,
                name,
                description,
                isPrivate,
                ownerId,
                collaborators: [ownerId],
                branches: ['main'],
                defaultBranch: 'main',
                createdAt: new Date(),
                updatedAt: new Date(),
                stars: 0,
                forks: 0,
                size: 0,
                language: 'Unity C#',
                topics: ['ar', 'vr', 'data-visualization', 'cad'],
                files: new Map(),
                commits: [],
                issues: [],
                pullRequests: []
            };
            
            this.repositories.set(repoId, repository);
            
            // Create main branch
            await this.createInitialBranch(repoId, 'main');
            
            this.metrics.totalProjects++;
            
            console.log(`📁 Repository created: ${name} (${repoId})`);
            res.status(201).json(repository);
            
        } catch (error) {
            console.error('❌ Repository creation error:', error);
            res.status(500).json({ error: 'Failed to create repository' });
        }
    }
    
    async createInitialBranch(repoId, branchName) {
        const branchId = `${repoId}:${branchName}`;
        const branch = {
            id: branchId,
            name: branchName,
            repositoryId: repoId,
            commits: [],
            head: null,
            protection: branchName === 'main',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        this.branches.set(branchId, branch);
        return branch;
    }
    
    async listRepositories(req, res) {
        try {
            const { userId, type = 'all' } = req.query;
            let repositories = Array.from(this.repositories.values());
            
            if (userId) {
                repositories = repositories.filter(repo => 
                    repo.ownerId === userId || repo.collaborators.includes(userId)
                );
            }
            
            if (type === 'owned') {
                repositories = repositories.filter(repo => repo.ownerId === userId);
            } else if (type === 'collaborated') {
                repositories = repositories.filter(repo => 
                    repo.collaborators.includes(userId) && repo.ownerId !== userId
                );
            }
            
            res.json(repositories);
            
        } catch (error) {
            console.error('❌ Repository listing error:', error);
            res.status(500).json({ error: 'Failed to list repositories' });
        }
    }
    
    async forkRepository(req, res) {
        try {
            const { repoId } = req.params;
            const { userId, name } = req.body;
            
            const originalRepo = this.repositories.get(repoId);
            if (!originalRepo) {
                return res.status(404).json({ error: 'Repository not found' });
            }
            
            const forkId = uuidv4();
            const fork = {
                ...originalRepo,
                id: forkId,
                name: name || `${originalRepo.name}-fork`,
                ownerId: userId,
                collaborators: [userId],
                parent: repoId,
                forks: 0,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            
            this.repositories.set(forkId, fork);
            originalRepo.forks++;
            
            console.log(`🍴 Repository forked: ${originalRepo.name} -> ${fork.name}`);
            res.status(201).json(fork);
            
        } catch (error) {
            console.error('❌ Repository fork error:', error);
            res.status(500).json({ error: 'Failed to fork repository' });
        }
    }
    
    // Branch Management
    async createBranch(req, res) {
        try {
            const { repoId } = req.params;
            const { name, from = 'main' } = req.body;
            
            const repository = this.repositories.get(repoId);
            if (!repository) {
                return res.status(404).json({ error: 'Repository not found' });
            }
            
            if (repository.branches.includes(name)) {
                return res.status(409).json({ error: 'Branch already exists' });
            }
            
            const branch = await this.createInitialBranch(repoId, name);
            
            // Copy commits from source branch
            const sourceBranchId = `${repoId}:${from}`;
            const sourceBranch = this.branches.get(sourceBranchId);
            if (sourceBranch) {
                branch.commits = [...sourceBranch.commits];
                branch.head = sourceBranch.head;
            }
            
            repository.branches.push(name);
            repository.updatedAt = new Date();
            
            console.log(`🌿 Branch created: ${name} in ${repository.name}`);
            res.status(201).json(branch);
            
        } catch (error) {
            console.error('❌ Branch creation error:', error);
            res.status(500).json({ error: 'Failed to create branch' });
        }
    }
    
    // Commit Management
    async createCommit(req, res) {
        try {
            const { repoId } = req.params;
            const { branch = 'main', message, authorId, changes } = req.body;
            
            const repository = this.repositories.get(repoId);
            if (!repository) {
                return res.status(404).json({ error: 'Repository not found' });
            }
            
            const commitId = uuidv4();
            const commit = {
                id: commitId,
                repositoryId: repoId,
                branch,
                message,
                authorId,
                changes: changes || [],
                timestamp: new Date(),
                hash: crypto.createHash('sha256').update(`${commitId}:${message}:${Date.now()}`).digest('hex').substring(0, 7),
                parent: null
            };
            
            // Set parent commit
            const branchId = `${repoId}:${branch}`;
            const branchObj = this.branches.get(branchId);
            if (branchObj && branchObj.head) {
                commit.parent = branchObj.head;
            }
            
            // Update branch head
            if (branchObj) {
                branchObj.head = commitId;
                branchObj.commits.push(commitId);
            }
            
            this.commits.set(commitId, commit);
            repository.commits.push(commitId);
            repository.updatedAt = new Date();
            this.metrics.totalCommits++;
            
            // Broadcast commit to active sessions
            await this.broadcastToRepository(repoId, {
                type: 'commit_created',
                commit
            });
            
            console.log(`📝 Commit created: ${commit.hash} - ${message}`);
            res.status(201).json(commit);
            
        } catch (error) {
            console.error('❌ Commit creation error:', error);
            res.status(500).json({ error: 'Failed to create commit' });
        }
    }
    
    // Pull Request Management
    async createPullRequest(req, res) {
        try {
            const { repoId } = req.params;
            const { title, description, sourceBranch, targetBranch, authorId } = req.body;
            
            const repository = this.repositories.get(repoId);
            if (!repository) {
                return res.status(404).json({ error: 'Repository not found' });
            }
            
            const pullId = uuidv4();
            const pullRequest = {
                id: pullId,
                repositoryId: repoId,
                title,
                description,
                sourceBranch,
                targetBranch,
                authorId,
                status: 'open',
                mergeable: true,
                conflicts: [],
                reviews: [],
                comments: [],
                createdAt: new Date(),
                updatedAt: new Date()
            };
            
            this.pullRequests.set(pullId, pullRequest);
            repository.pullRequests.push(pullId);
            
            console.log(`🔄 Pull request created: ${title} (${pullId})`);
            res.status(201).json(pullRequest);
            
        } catch (error) {
            console.error('❌ Pull request creation error:', error);
            res.status(500).json({ error: 'Failed to create pull request' });
        }
    }
    
    // AR Session Management
    async createARSession(req, res) {
        try {
            const { repositoryId, branchName = 'main', hostId, name, description, maxUsers = 10 } = req.body;
            
            if (!repositoryId || !hostId) {
                return res.status(400).json({ error: 'Repository ID and host ID are required' });
            }
            
            const sessionId = uuidv4();
            const session = {
                id: sessionId,
                repositoryId,
                branchName,
                hostId,
                name: name || `AR Session - ${new Date().toLocaleString()}`,
                description,
                maxUsers,
                users: [hostId],
                isActive: true,
                createdAt: new Date(),
                lastActivity: new Date(),
                arObjects: new Map(),
                annotations: new Map(),
                voiceChannels: new Map(),
                screenShares: new Map()
            };
            
            this.sessions.set(sessionId, session);
            this.metrics.activeSessions++;
            
            console.log(`🥽 AR Session created: ${session.name} (${sessionId})`);
            res.status(201).json(session);
            
        } catch (error) {
            console.error('❌ AR Session creation error:', error);
            res.status(500).json({ error: 'Failed to create AR session' });
        }
    }
    
    async joinARSession(req, res) {
        try {
            const { sessionId } = req.params;
            const { userId, deviceType = 'desktop' } = req.body;
            
            const session = this.sessions.get(sessionId);
            if (!session) {
                return res.status(404).json({ error: 'Session not found' });
            }
            
            if (!session.isActive) {
                return res.status(409).json({ error: 'Session is not active' });
            }
            
            if (session.users.length >= session.maxUsers) {
                return res.status(409).json({ error: 'Session is full' });
            }
            
            if (!session.users.includes(userId)) {
                session.users.push(userId);
                session.lastActivity = new Date();
            }
            
            // Store user device info
            if (!this.users.has(userId)) {
                this.users.set(userId, {
                    id: userId,
                    deviceType,
                    joinedAt: new Date(),
                    lastSeen: new Date()
                });
            }
            
            this.metrics.activeUsers = Math.max(this.metrics.activeUsers, this.users.size);
            
            // Broadcast user joined
            await this.broadcastToSession(sessionId, {
                type: 'user_joined',
                userId,
                deviceType,
                timestamp: new Date()
            }, userId);
            
            console.log(`👤 User ${userId} joined AR session ${sessionId}`);
            res.json({ success: true, session });
            
        } catch (error) {
            console.error('❌ AR Session join error:', error);
            res.status(500).json({ error: 'Failed to join session' });
        }
    }
    
    // Real-time collaboration handlers
    async handleJoinSession(ws, payload) {
        const { sessionId, userId } = payload;
        
        ws.sessionId = sessionId;
        ws.userId = userId;
        
        const session = this.sessions.get(sessionId);
        if (session) {
            session.lastActivity = new Date();
            
            // Send current session state to new user
            ws.send(JSON.stringify({
                type: 'session_state',
                payload: {
                    session,
                    arObjects: Array.from(session.arObjects.values()),
                    annotations: Array.from(session.annotations.values())
                }
            }));
        }
    }
    
    async broadcastARTransform(ws, payload) {
        const { objectId, transform, userId } = payload;
        const sessionId = ws.sessionId;
        
        if (!sessionId) return;
        
        const session = this.sessions.get(sessionId);
        if (session) {
            session.arObjects.set(objectId, {
                id: objectId,
                transform,
                userId,
                timestamp: new Date()
            });
            
            await this.broadcastToSession(sessionId, {
                type: 'ar_transform_update',
                objectId,
                transform,
                userId,
                timestamp: new Date()
            }, userId);
        }
    }
    
    async broadcastARAnnotation(ws, payload) {
        const { annotationId, position, text, userId } = payload;
        const sessionId = ws.sessionId;
        
        if (!sessionId) return;
        
        const session = this.sessions.get(sessionId);
        if (session) {
            session.annotations.set(annotationId, {
                id: annotationId,
                position,
                text,
                userId,
                timestamp: new Date()
            });
            
            await this.broadcastToSession(sessionId, {
                type: 'ar_annotation_added',
                annotation: {
                    id: annotationId,
                    position,
                    text,
                    userId,
                    timestamp: new Date()
                }
            }, userId);
        }
    }
    
    async handleModelUpdate(ws, payload) {
        const { changes, commitMessage } = payload;
        const sessionId = ws.sessionId;
        const userId = ws.userId;
        
        if (!sessionId || !userId) return;
        
        const session = this.sessions.get(sessionId);
        if (session) {
            // Auto-commit changes in collaborative sessions
            try {
                const response = await fetch(`http://localhost:${process.env.PORT || 5001}/api/repositories/${session.repositoryId}/commits`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        branch: session.branchName,
                        message: commitMessage || `Auto-commit from AR session: ${changes.length} changes`,
                        authorId: userId,
                        changes
                    })
                });
                
                if (response.ok) {
                    const commit = await response.json();
                    
                    await this.broadcastToSession(sessionId, {
                        type: 'model_committed',
                        commit,
                        userId
                    });
                }
            } catch (error) {
                console.error('❌ Auto-commit error:', error);
            }
        }
    }
    
    async broadcastToSession(sessionId, message, excludeUserId = null) {
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN && 
                client.sessionId === sessionId && 
                client.userId !== excludeUserId) {
                client.send(JSON.stringify(message));
            }
        });
    }
    
    async broadcastToRepository(repositoryId, message) {
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                const session = this.sessions.get(client.sessionId);
                if (session && session.repositoryId === repositoryId) {
                    client.send(JSON.stringify(message));
                }
            }
        });
    }
    
    handleUserDisconnect(ws) {
        if (ws.sessionId && ws.userId) {
            const session = this.sessions.get(ws.sessionId);
            if (session) {
                session.users = session.users.filter(id => id !== ws.userId);
                
                this.broadcastToSession(ws.sessionId, {
                    type: 'user_left',
                    userId: ws.userId,
                    timestamp: new Date()
                });
                
                if (session.users.length === 0) {
                    session.isActive = false;
                    this.metrics.activeSessions--;
                }
            }
        }
        
        console.log('👤 User disconnected from WebSocket');
    }
    
    // Health and metrics
    async getMetrics(req, res) {
        this.metrics.lastUpdate = new Date();
        this.metrics.totalProjects = this.repositories.size;
        this.metrics.activeSessions = Array.from(this.sessions.values()).filter(s => s.isActive).length;
        this.metrics.activeUsers = this.users.size;
        
        res.json(this.metrics);
    }
    
    async healthCheck(req, res) {
        res.json({
            status: 'healthy',
            timestamp: new Date(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: '1.0.0'
        });
    }
    
    // Utility methods
    async getRepository(req, res) {
        const { repoId } = req.params;
        const repository = this.repositories.get(repoId);
        
        if (!repository) {
            return res.status(404).json({ error: 'Repository not found' });
        }
        
        res.json(repository);
    }
    
    async getBranches(req, res) {
        const { repoId } = req.params;
        const branches = Array.from(this.branches.values())
            .filter(branch => branch.repositoryId === repoId);
        
        res.json(branches);
    }
    
    async getCommits(req, res) {
        const { repoId } = req.params;
        const { branch = 'main', limit = 50 } = req.query;
        
        const branchId = `${repoId}:${branch}`;
        const branchObj = this.branches.get(branchId);
        
        if (!branchObj) {
            return res.status(404).json({ error: 'Branch not found' });
        }
        
        const commits = branchObj.commits
            .slice(-limit)
            .map(commitId => this.commits.get(commitId))
            .filter(commit => commit)
            .reverse();
        
        res.json(commits);
    }
    
    async getPullRequests(req, res) {
        const { repoId } = req.params;
        const { status = 'all' } = req.query;
        
        let pullRequests = Array.from(this.pullRequests.values())
            .filter(pr => pr.repositoryId === repoId);
        
        if (status !== 'all') {
            pullRequests = pullRequests.filter(pr => pr.status === status);
        }
        
        res.json(pullRequests);
    }
    
    async listARSessions(req, res) {
        const { repositoryId, isActive } = req.query;
        let sessions = Array.from(this.sessions.values());
        
        if (repositoryId) {
            sessions = sessions.filter(session => session.repositoryId === repositoryId);
        }
        
        if (isActive !== undefined) {
            const active = isActive === 'true';
            sessions = sessions.filter(session => session.isActive === active);
        }
        
        res.json(sessions);
    }
}

// Start the collaboration engine
const engine = new CollaborationEngine();

module.exports = CollaborationEngine;
