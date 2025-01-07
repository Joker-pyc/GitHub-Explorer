let currentView = 'grid';
let toast;
let charts;

document.addEventListener('DOMContentLoaded', () => {
    toast = new Toast();
    charts = new GitHubCharts();

    // Initialize event listeners
    document.getElementById('searchForm').addEventListener('submit', (e) => {
        e.preventDefault();
        fetchRepos();
    });

    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('gridViewBtn').addEventListener('click', () => setView('grid'));
    document.getElementById('listViewBtn').addEventListener('click', () => setView('list'));
    document.getElementById('copyAllBtn').addEventListener('click', copyAllRepoUrls);

    // Initialize theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.querySelector('#themeToggle i').classList.add('fa-sun');
    }
});

async function fetchRepos() {
    const input = document.getElementById('username').value.trim();
    if (!input) {
        toast.show('Please enter a GitHub username or URL', 'error');
        return;
    }

    toggleLoadingState(true);
    toggleDashboard(false);

    try {
        const response = await fetch(`https://github-explorer-mbqp.onrender.com/api/repos/${input}`);
        const data = await response.json();
       
        if (response.ok) {
            window.currentRepos = data.repositories;
            updateUI(data);
            toggleDashboard(true);
            toast.show('Data fetched successfully!', 'success');
        } else {
            throw new Error(data.error || 'Failed to fetch data');
        }
    } catch (error) {
        console.error('Error:', error);
        toast.show(error.message, 'error');
    } finally {
        toggleLoadingState(false);
    }
}


function updateUI(data) {
    updateProfileInfo(data.user);
    updateOverviewStats(data);
    updateStats(data.repositories);
    updateRepoNames(data.repositories);
    updateRepoLinks(data.repositories);
    updateLanguageStats(data.stats.languages);
    updateDetailedView(data.repositories);
    charts.initialize(data);
}

function updateProfileInfo(user) {
    const profileSection = document.getElementById('profile-info');
    if (user) {
        document.getElementById('profile-avatar').src = user.avatar_url;
        document.getElementById('profile-name').textContent = user.name || user.login;
        document.getElementById('profile-bio').textContent = user.bio || 'No bio available';
        profileSection.classList.remove('hidden');
    }
}

function updateOverviewStats(data) {
    document.getElementById('overview-stats').innerHTML = `
        <div class="stat-card-modern">
            <i class="fas fa-code-branch text-2xl mb-2 text-blue-400"></i>
            <div class="text-3xl font-bold neon-text">${data.user.public_repos}</div>
            <div class="text-sm">Total Repos</div>
        </div>
        <div class="stat-card-modern">
            <i class="fas fa-star text-2xl mb-2 text-yellow-400"></i>
            <div class="text-3xl font-bold neon-text">${data.stats.total_stars}</div>
            <div class="text-sm">Total Stars</div>
        </div>
        <div class="stat-card-modern">
            <i class="fas fa-code text-2xl mb-2 text-green-400"></i>
            <div class="text-3xl font-bold neon-text">${Object.keys(data.stats.languages).length}</div>
            <div class="text-sm">Languages</div>
        </div>
        <div class="stat-card-modern">
            <i class="fas fa-users text-2xl mb-2 text-purple-400"></i>
            <div class="text-3xl font-bold neon-text">${data.user.followers}</div>
            <div class="text-sm">Followers</div>
        </div>
    `;
}

function updateStats(repos) {
    const totalSize = repos.reduce((acc, repo) => acc + repo.size, 0);
    document.getElementById('stats').innerHTML = `
        <div class="stat-card-modern">
            <div class="text-3xl font-bold neon-text">${repos.length}</div>
            <div class="text-sm">Repositories</div>
        </div>
        <div class="stat-card-modern">
            <div class="text-3xl font-bold neon-text">${formatSize(totalSize)}</div>
            <div class="text-sm">Total Size</div>
        </div>
    `;
}

function updateRepoNames(repos) {
    document.getElementById('repo-names').innerHTML = repos.map(repo => `
        <div class="repo-card-modern">
            <span class="font-medium">${repo.name}</span>
            <span class="text-sm text-gray-400">${formatDate(repo.created_at)}</span>
        </div>
    `).join('');
}

function updateRepoLinks(repos) {
    const repoLinksContainer = document.getElementById('repo-links');
    repoLinksContainer.innerHTML = repos.map(repo => `
      <div class="flex items-center justify-between repo-card-modern px-4 py-2">
        <a href="${repo.url}" target="_blank" class="hover:text-blue-400 truncate">
          ${repo.name}
        </a>
        <button class="copy-url-btn" data-url="${repo.url}" title="Copy URL">
          <i class="fas fa-copy text-gray-400 hover:text-blue-400"></i>
        </button>
      </div>
    `).join('');
  
    // Add event listeners to copy buttons
    repoLinksContainer.querySelectorAll('.copy-url-btn').forEach(button => {
      button.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent triggering the parent's click event
        const url = button.dataset.url;
        copyToClipboard(url, 'URL copied to clipboard!');
      });
    });
  }
  

function updateLanguageStats(languages) {
    const sortedLanguages = Object.entries(languages).sort(([,a], [,b]) => b - a);
    document.getElementById('language-stats').innerHTML = sortedLanguages.map(([lang, count]) => `
        <div class="repo-card-modern">
            <div class="flex items-center justify-between">
                <span class="language-tag">${lang}</span>
                <div class="flex items-center">
                    <span class="font-bold mr-2">${count}</span>
                    <div class="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div class="h-full bg-blue-400" style="width: ${(count/sortedLanguages[0][1])*100}%"></div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function updateDetailedView(repos) {
    const detailedRepos = document.getElementById('detailed-repos');
    detailedRepos.className = `grid gap-4 ${currentView === 'grid' ? 'grid-cols-1 md:grid-cols-2' : ''}`;
    
    detailedRepos.innerHTML = repos.map(repo => `
        <div class="repo-card-modern">
            <div class="flex justify-between items-start mb-2">
                <h3 class="text-xl font-bold">
                    <a href="${repo.url}" target="_blank" class="hover:text-blue-400 flex items-center">
                        ${repo.name}
                        <i class="fas fa-external-link-alt text-sm ml-2"></i>
                    </a>
                </h3>
                <div class="flex gap-2">
                    ${repo.language ? `<span class="language-tag">${repo.language}</span>` : ''}
                    ${repo.is_fork ? '<span class="fork-tag"><i class="fas fa-code-branch"></i> Fork</span>' : ''}
                </div>
            </div>
            <p class="text-gray-300 mb-3">${repo.description || 'No description available'}</p>
            <div class="flex flex-wrap gap-4 text-sm text-gray-400">
                <span><i class="fas fa-star"></i> ${repo.stars}</span>
                <span><i class="fas fa-code-fork"></i> ${repo.forks}</span>
                <span><i class="fas fa-clock"></i> ${formatDate(repo.updated_at)}</span>
                <span><i class="fas fa-weight-hanging"></i> ${formatSize(repo.size)}</span>
            </div>
        </div>
    `).join('');
}

function toggleLoadingState(isLoading) {
    document.getElementById('loading-indicator').classList.toggle('hidden', !isLoading);
}

function toggleDashboard(show) {
    document.getElementById('dashboard').classList.toggle('hidden', !show);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatSize(size) {
    const units = ['KB', 'MB', 'GB'];
    let index = 0;
    let value = size;

    while (value > 1024 && index < units.length - 1) {
        value /= 1024;
        index++;
    }

    return `${value.toFixed(1)} ${units[index]}`;
}

function toggleTheme() {
    document.documentElement.classList.toggle('dark');
    const icon = document.querySelector('#themeToggle i');
    icon.classList.toggle('fa-moon');
    icon.classList.toggle('fa-sun');
    
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function setView(view) {
    currentView = view;
    document.querySelectorAll('.view-toggle-btn').forEach(btn =>
        btn.classList.toggle('active', btn.id === `${view}ViewBtn`)
    );
    updateDetailedView(window.currentRepos || []);
}

function copyToClipboard(text, message) {
    navigator.clipboard.writeText(text).then(() => {
      toast.show(message, 'success');
    }).catch(err => {
      console.error('Failed to copy:', err);
      toast.show('Failed to copy text', 'error');
    });
  }
  
  function copyAllRepoUrls() {
    if (!window.currentRepos || window.currentRepos.length === 0) {
      toast.show('No repositories to copy URLs from', 'error');
      return;
    }
  
    const allUrls = window.currentRepos.map(repo => repo.url).join('\n');
    copyToClipboard(allUrls, 'All Repo URLs copied to clipboard!');
  }