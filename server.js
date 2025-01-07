const express = require('express');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Enhanced middleware setup
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(cors());

// Advanced rate limiting configuration
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api/', limiter);

// GitHub API configuration
const githubConfig = {
    headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': process.env.GITHUB_TOKEN ? `token ${process.env.GITHUB_TOKEN}` : undefined
    }
};

// Enhanced username extraction
function extractUsername(input) {
    if (!input) return null;
    const githubUrlPattern = /github\.com\/([^\/]+)/;
    const match = input.match(githubUrlPattern);
    return match ? match[1] : input;
}

// Main API endpoint with enhanced error handling
app.get('/api/repos/:input', async (req, res) => {
    try {
        const username = extractUsername(req.params.input);
        if (!username) {
            return res.status(400).json({ 
                error: 'Invalid username input',
                details: 'Please provide a valid GitHub username or URL'
            });
        }

        const [userResponse, reposResponse] = await Promise.all([
            axios.get(`https://api.github.com/users/${username}`, githubConfig),
            axios.get(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, githubConfig)
        ]);

        const repos = reposResponse.data.map(repo => ({
            id: repo.id,
            name: repo.name,
            full_name: repo.full_name,
            description: repo.description,
            url: repo.html_url,
            homepage: repo.homepage,
            stars: repo.stargazers_count,
            watchers: repo.watchers_count,
            forks: repo.forks_count,
            language: repo.language,
            topics: repo.topics,
            created_at: repo.created_at,
            updated_at: repo.updated_at,
            pushed_at: repo.pushed_at,
            size: repo.size,
            default_branch: repo.default_branch,
            is_fork: repo.fork,
            open_issues: repo.open_issues_count
        }));

        const response = {
            user: {
                login: userResponse.data.login,
                name: userResponse.data.name,
                avatar_url: userResponse.data.avatar_url,
                bio: userResponse.data.bio,
                public_repos: userResponse.data.public_repos,
                followers: userResponse.data.followers,
                following: userResponse.data.following,
                created_at: userResponse.data.created_at,
                updated_at: userResponse.data.updated_at
            },
            repositories: repos,
            stats: {
                total_repos: repos.length,
                total_stars: repos.reduce((acc, repo) => acc + repo.stars, 0),
                total_forks: repos.reduce((acc, repo) => acc + repo.forks, 0),
                languages: repos.reduce((acc, repo) => {
                    if (repo.language) {
                        acc[repo.language] = (acc[repo.language] || 0) + 1;
                    }
                    return acc;
                }, {}),
                latest_update: repos.length > 0 ? 
                    repos.reduce((latest, repo) => 
                        new Date(repo.updated_at) > new Date(latest) ? repo.updated_at : latest
                    , repos[0].updated_at) : null
            }
        };

        res.json(response);

    } catch (error) {
        const statusCode = error.response?.status || 500;
        const errorMessage = {
            404: 'GitHub user not found',
            403: 'API rate limit exceeded',
            500: 'Internal server error',
            400: 'Bad request'
        }[statusCode] || 'An unexpected error occurred';

        res.status(statusCode).json({
            error: errorMessage,
            details: error.response?.data?.message || error.message
        });
    }
});

// Health check endpoint with enhanced information
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

// Error handling for undefined routes
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Health check available at http://localhost:${port}/health`);
});
