const STORAGE_KEY = 'dispatch_stories_v1';
    let stories = [];
    let editingId = null;
    let deletingId = null;
    let activeCategory = 'all';

    // ── RENDER GRID ──
    function renderGrid() {
      const search = document.getElementById('search-input').value.toLowerCase();

      let filtered = stories.filter(s => {
        const matchCat = activeCategory === 'all' || s.category === activeCategory;
        const matchSearch = !search ||
          s.headline.toLowerCase().includes(search) ||
          s.reporter.toLowerCase().includes(search);
        return matchCat && matchSearch;
      });

      filtered.sort((a, b) => b.created - a.created);

      const grid = document.getElementById('news-grid');
      
      if (filtered.length === 0) {
        grid.innerHTML = '<div class="empty-state"><h3>No stories found</h3><p>Click "Publish Story" to add one.</p></div>';
        return;
      }

      grid.innerHTML = filtered.map(s => `
        <article class="news-card">
          <div class="card-top-bar ${s.category.toLowerCase()}"></div>
          <div class="card-body">
            <h3>${escapeHtml(s.headline)}</h3>
            <p>By ${escapeHtml(s.reporter)} · ${s.date}</p>
            <p>${escapeHtml(s.body.slice(0, 180))}${s.body.length > 180 ? '…' : ''}</p>
          </div>
          <div class="card-footer">
            <button onclick="openEditModal('${s.id}')">Edit</button>
            <button onclick="openConfirmDelete('${s.id}')">Delete</button>
          </div>
        </article>
      `).join('');
    }

    // ── ADD ──
    function openAddModal() {
      editingId = null;
      clearForm();
      document.getElementById('modal-title').textContent = 'Publish New Story';
      document.getElementById('story-modal').classList.add('active');
    }

    // ── EDIT ──
    function openEditModal(id) {
      const s = stories.find(x => x.id === id);
      if (!s) return;
      editingId = id;
      document.getElementById('field-headline').value = s.headline;
      document.getElementById('field-reporter').value = s.reporter;
      document.getElementById('field-body').value = s.body;
      document.getElementById('field-category').value = s.category;
      document.getElementById('modal-title').textContent = 'Edit Story';
      document.getElementById('story-modal').classList.add('active');
    }

    // ── SUBMIT ──
    function submitStory() {
      const headline = document.getElementById('field-headline').value.trim();
      const reporter = document.getElementById('field-reporter').value.trim();
      const body = document.getElementById('field-body').value.trim();
      const category = document.getElementById('field-category').value;

      if (!headline || !reporter || !body || !category) {
        alert('Please fill in all fields');
        return;
      }

      if (editingId) {
        const idx = stories.findIndex(s => s.id === editingId);
        stories[idx] = { ...stories[idx], headline, reporter, body, category };
      } else {
        stories.unshift({
          id: uid(),
          headline, reporter, body, category,
          date: todayStr(),
          created: Date.now()
        });
      }

      saveStories();
      closeModal();
      renderGrid();
    }

    // ── DELETE ──
    function openConfirmDelete(id) {
      deletingId = id;
      document.getElementById('confirm-modal').classList.add('active');
    }

    function executeDelete() {
      stories = stories.filter(s => s.id !== deletingId);
      saveStories();
      closeConfirm();
      renderGrid();
    }

    // ── MODAL CONTROLS ──
    function closeModal() {
      document.getElementById('story-modal').classList.remove('active');
      editingId = null;
    }

    function closeConfirm() {
      document.getElementById('confirm-modal').classList.remove('active');
      deletingId = null;
    }

    function clearForm() {
      document.getElementById('field-headline').value = '';
      document.getElementById('field-reporter').value = '';
      document.getElementById('field-body').value = '';
      document.getElementById('field-category').value = '';
    }

    // ── STORAGE ──
    function saveStories() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
    }

    function loadStories() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        stories = raw ? JSON.parse(raw) : [];
      } catch {
        stories = [];
      }
    }

    function seedDefaults() {
      stories = [
        {
          id: uid(),
          headline: "Global Leaders Convene for Emergency Climate Summit",
          category: "World",
          reporter: "Amara Osei",
          body: "Heads of state from 140 nations gathered in Geneva this week for what experts are calling the most consequential climate summit in a decade.",
          date: todayStr(),
          created: Date.now()
        },
        {
          id: uid(),
          headline: "Tech Giants Face Sweeping New AI Regulation",
          category: "Tech",
          reporter: "Lin Wei",
          body: "A landmark bill passed by the European Parliament would impose strict transparency requirements on large AI models.",
          date: todayStr(),
          created: Date.now() - 3600000
        },
        {
          id: uid(),
          headline: "Senate Deadlocked on Immigration Reform Bill",
          category: "Politics",
          reporter: "Ray Donovan",
          body: "The Senate adjourned without a vote on the bipartisan immigration bill after a procedural blockade.",
          date: todayStr(),
          created: Date.now() - 7200000
        }
      ];
      saveStories();
    }

    // ── HELPERS ──
    function uid() {
      return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }

    function todayStr() {
      return new Date().toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' });
    }

    function escapeHtml(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    // ── INIT ──
    function init() {
      loadStories();
      if (stories.length === 0) seedDefaults();
      renderGrid();

      // Update date
      document.getElementById('live-date').textContent = 
        new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

      // Category filter buttons
      document.querySelectorAll('.filter-tab').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          activeCategory = btn.dataset.cat;
          renderGrid();
        });
      });

      // Escape key closes modals
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
          closeModal();
          closeConfirm();
        }
      });

      // Click outside modal to close
      document.getElementById('story-modal').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
      });
      document.getElementById('confirm-modal').addEventListener('click', function(e) {
        if (e.target === this) closeConfirm();
      });
    }

    // ── START ──
    init();
