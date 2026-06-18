// 全局变量
const isLoggedIn = false; // 模拟用户登录状态

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    // 初始化页面功能
    initNavigation();
    initBackToTopButton();
    initRouteCards();
    initFilters();
    initPopularRoutes();
    initLoginLogout();
    initSearch();
    initPagination();
});

// 初始化导航功能
function initNavigation() {
    // 获取所有导航链接
    const navLinks = document.querySelectorAll('.nav-link');
    const currentPath = window.location.pathname;
    
    // 设置当前页面导航链接高亮
    navLinks.forEach(link => {
        const linkPath = new URL(link.href).pathname;
        if (currentPath.includes(linkPath) && linkPath !== '/') {
            link.classList.add('active');
        }
        
        // 添加导航链接点击事件
        link.addEventListener('click', function(e) {
            // 移除所有活跃状态
            navLinks.forEach(l => l.classList.remove('active'));
            // 添加当前链接活跃状态
            this.classList.add('active');
        });
    });
}

// 初始化返回顶部按钮
function initBackToTopButton() {
    const backToTopButton = document.getElementById('back-to-top');
    
    // 检查按钮是否存在
    if (!backToTopButton) return;
    
    // 监听滚动事件
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            backToTopButton.style.display = 'flex';
        } else {
            backToTopButton.style.display = 'none';
        }
    });
    
    // 添加点击事件
    backToTopButton.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// 初始化路线卡片功能
function initRouteCards() {
    const routeCards = document.querySelectorAll('.route-card');
    
    routeCards.forEach(card => {
        // 添加鼠标悬停效果（已经通过CSS实现）
        
        // 添加点击事件
        card.addEventListener('click', function(e) {
            // 如果点击的是按钮，不进行路由跳转
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
                return;
            }
            
            const routeId = this.getAttribute('data-route-id');
            console.log(`查看路线详情：${routeId}`);
            // 这里可以添加路由详情页跳转逻辑
            // window.location.href = `route-details.html?id=${routeId}`;
        });
        
        // 为卡片内的按钮添加点击事件
        const detailsButton = card.querySelector('.btn-outline');
        if (detailsButton) {
            detailsButton.addEventListener('click', function(e) {
                e.stopPropagation(); // 阻止冒泡到卡片
                const routeId = card.getAttribute('data-route-id');
                console.log(`点击查看路线详情按钮：${routeId}`);
                // 这里可以添加路由详情页跳转逻辑
                // window.location.href = `route-details.html?id=${routeId}`;
            });
        }
    });
}

// 初始化筛选功能
function initFilters() {
    const filterForm = document.querySelector('.filter-section');
    if (!filterForm) return;
    
    const filterBtn = filterForm.querySelector('.btn-primary');
    const resetBtn = filterForm.querySelector('.btn-outline');
    
    // 筛选按钮点击事件
    if (filterBtn) {
        filterBtn.addEventListener('click', function() {
            const region = document.getElementById('region')?.value || '';
            const difficulty = document.getElementById('difficulty')?.value || '';
            const duration = document.getElementById('duration')?.value || '';
            const season = document.getElementById('season')?.value || '';
            
            console.log('应用筛选条件:', { region, difficulty, duration, season });
            
            // 这里可以添加筛选逻辑，例如隐藏不符合条件的路线卡片
            // 模拟筛选效果
            alert(`筛选条件已应用：地区=${region || '全部'}, 难度=${difficulty || '全部'}, 时长=${duration || '全部'}, 季节=${season || '全部'}`);
        });
    }
    
    // 重置按钮点击事件
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            document.getElementById('region')?.value = '';
            document.getElementById('difficulty')?.value = '';
            document.getElementById('duration')?.value = '';
            document.getElementById('season')?.value = '';
            
            console.log('重置筛选条件');
        });
    }
}

// 初始化热门路线功能
function initPopularRoutes() {
    const popularRouteItems = document.querySelectorAll('.popular-route-item');
    
    popularRouteItems.forEach(item => {
        item.addEventListener('click', function() {
            const routeId = this.getAttribute('data-route-id');
            console.log(`点击热门路线：${routeId}`);
            // 这里可以添加路由详情页跳转逻辑
            // window.location.href = `route-details.html?id=${routeId}`;
        });
    });
}

// 初始化登录登出功能
function initLoginLogout() {
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const loginText = document.getElementById('login-text');
    
    // 检查用户登录状态
    updateLoginStatus();
    
    // 登录按钮点击事件
    loginBtn.addEventListener('click', function(e) {
        e.preventDefault();
        
        if (isLoggedIn) {
            // 如果已登录，执行登出操作
            logout();
        } else {
            // 如果未登录，显示登录表单
            showLoginForm();
        }
    });
    
    // 注册按钮点击事件
    registerBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (!isLoggedIn) {
            showRegisterForm();
        }
    });
    
    // 更新登录状态显示
    function updateLoginStatus() {
        if (isLoggedIn) {
            loginText.textContent = '登出';
            // 可以根据需要隐藏注册按钮
            registerBtn.style.display = 'none';
        } else {
            loginText.textContent = '登录';
            registerBtn.style.display = 'inline-block';
        }
    }
    
    // 登录函数
    function login() {
        // 模拟登录逻辑
        console.log('用户登录');
        // 实际项目中这里应该调用API进行登录验证
        updateLoginStatus();
        alert('登录成功！');
    }
    
    // 登出函数
    function logout() {
        // 模拟登出逻辑
        console.log('用户登出');
        updateLoginStatus();
        alert('已成功登出！');
    }
    
    // 显示登录表单
    function showLoginForm() {
        console.log('显示登录表单');
        // 实际项目中这里应该显示登录模态框或跳转到登录页面
        alert('登录功能待实现');
    }
    
    // 显示注册表单
    function showRegisterForm() {
        console.log('显示注册表单');
        // 实际项目中这里应该显示注册模态框或跳转到注册页面
        alert('注册功能待实现');
    }
}

// 初始化搜索功能
function initSearch() {
    const searchInput = document.querySelector('.search-input');
    const searchBtn = document.getElementById('search-btn');
    
    // 如果页面上没有搜索功能，直接返回
    if (!searchInput || !searchBtn) {
        return;
    }
    
    // 搜索按钮点击事件
    searchBtn.addEventListener('click', function() {
        const searchTerm = searchInput.value.trim();
        if (searchTerm) {
            performSearch(searchTerm);
        }
    });
    
    // 回车键搜索
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const searchTerm = searchInput.value.trim();
            if (searchTerm) {
                performSearch(searchTerm);
            }
        }
    });
    
    // 执行搜索
    function performSearch(term) {
        console.log('搜索路线：', term);
        // 这里可以添加搜索逻辑
        alert(`正在搜索："${term}"`);
    }
}

// 初始化分页功能
function initPagination() {
    const paginationLinks = document.querySelectorAll('.pagination a');
    
    paginationLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (this.textContent === '‹') {
                console.log('上一页');
            } else if (this.textContent === '›') {
                console.log('下一页');
            } else {
                console.log(`跳转到第${this.textContent}页`);
                // 模拟页码跳转
                updateActivePage(this.textContent);
            }
        });
    });
    
    // 更新活跃页码
    function updateActivePage(pageNum) {
        const pageNumbers = document.querySelectorAll('.pagination span, .pagination a');
        
        pageNumbers.forEach(page => {
            if (page.textContent === pageNum) {
                page.classList.add('active');
            } else {
                page.classList.remove('active');
            }
        });
    }
}

// 初始化类别点击功能
function initCategories() {
    const categoryLinks = document.querySelectorAll('.category-link');
    
    categoryLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const categoryName = this.textContent.trim().split(' ')[0];
            console.log(`选择类别：${categoryName}`);
            // 这里可以添加类别筛选逻辑
            alert(`筛选类别："${categoryName}"`);
        });
    });
}

// 初始化网站Logo点击事件
function initLogoClick() {
    const logo = document.getElementById('home-logo');
    if (logo) {
        logo.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('点击网站Logo');
            window.location.href = 'index.html';
        });
    }
}