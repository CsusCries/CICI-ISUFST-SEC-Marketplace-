        function showScreen(screenId, button) {
            // Hide all screens
            document.querySelectorAll('.screen').forEach(screen => {
                screen.classList.remove('active');
            });

            // Show selected screen
            document.getElementById(screenId).classList.add('active');

            // Update active nav button
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            if (button) button.classList.add('active');

            // Toggle back button
            const backBtn = document.getElementById('headerBack');
            if (screenId !== 'marketplace') {
                backBtn.classList.add('show');
            } else {
                backBtn.classList.remove('show');
            }

            window.scrollTo(0, 0);
        }

        function goBackHome() {
            showScreen('marketplace', document.querySelector('[data-nav=marketplace]'));
        }

        function setColumns(cols) {
            const grid = document.getElementById('listingsGrid');
            grid.classList.remove('cols-2', 'cols-3', 'cols-4');
            grid.classList.add(`cols-${cols}`);

            document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
            const target = document.querySelector(`.view-btn[onclick="setColumns(${cols})"]`);
            if (target) target.classList.add('active');
        }

        // ----- Staff roles (demo: no password check; a backend must enforce this) -----
        const ROLE_TABS = {
            cashier: ['pos'],
            admin: ['approvals', 'stats'],
            superadmin: ['approvals', 'pos', 'tax', 'genres', 'stats', 'staff']
        };
        const ROLE_LABELS = { cashier: 'Cashier', admin: 'Admin', superadmin: 'Super Admin' };
        let adminRole = null;
        let currentStaff = null;   // { username, name, role }
        const voidLog = [];

        // Demo accounts. A real app stores these on the server with hashed passwords.
        let staffAccounts = [
            { username: 'superadmin', name: 'Super Admin', password: 'superadmin123', role: 'superadmin' },
            { username: 'admin', name: 'Admin', password: 'admin12345', role: 'admin' },
            { username: 'cashier', name: 'Cashier', password: 'cashier123', role: 'cashier' }
        ];

        function adminTabEl(name) {
            return document.querySelector(`.admin-tab[onclick="switchAdminTab('${name}')"]`);
        }

        function renderAdmin() {
            const signedIn = !!adminRole;
            document.getElementById('adminSignIn').style.display = signedIn ? 'none' : 'block';
            document.getElementById('adminRoleBar').style.display = signedIn ? 'flex' : 'none';
            document.querySelector('.admin-header').style.display = signedIn ? 'block' : 'none';
            document.querySelector('.admin-tabs').style.display = signedIn ? 'grid' : 'none';

            const allowed = signedIn ? ROLE_TABS[adminRole] : [];
            document.querySelectorAll('.admin-tab').forEach(tab => {
                const name = (tab.getAttribute('onclick').match(/'(\w+)'/) || [])[1];
                tab.style.display = allowed.includes(name) ? '' : 'none';
            });
            document.querySelectorAll('.admin-panel').forEach(panel => {
                panel.style.display = signedIn ? '' : 'none';
                panel.classList.remove('active');
            });
            if (signedIn) {
                document.getElementById('adminRoleName').textContent = ROLE_LABELS[adminRole];
                document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
                switchAdminTab(allowed[0]);
            }
        }

        function adminSignIn() {
            const user = document.getElementById('staffUser').value.trim().toLowerCase();
            const pass = document.getElementById('staffPass').value;
            const account = staffAccounts.find(a => a.username === user && a.password === pass);
            const err = document.getElementById('staffLoginError');
            if (!account) {
                err.textContent = 'Invalid username or password';
                return;
            }
            err.textContent = '';
            currentStaff = { username: account.username, name: account.name, role: account.role };
            adminRole = account.role;
            document.getElementById('staffPass').value = '';
            renderAdmin();
        }

        function adminSignOut() {
            adminRole = null;
            currentStaff = null;
            posReset();
            renderAdmin();
            showScreen('marketplace', document.querySelector('[data-nav=marketplace]'));
        }

        // ----- Staff management (Super Admin) -----
        function renderStaffList() {
            const list = document.getElementById('staffList');
            const superCount = staffAccounts.filter(a => a.role === 'superadmin').length;
            list.innerHTML = staffAccounts.map(a => {
                const isMe = currentStaff && a.username === currentStaff.username;
                const lastSuper = a.role === 'superadmin' && superCount === 1;
                const blocked = isMe || lastSuper;
                const reason = isMe ? 'You' : (lastSuper ? 'Last Super Admin' : '');
                return `
                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; background: var(--bg-white); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; margin-bottom: 8px;">
                        <div>
                            <div style="font-weight: 600; font-size: 13px;">${a.name}</div>
                            <div style="font-size: 11px; color: var(--text-gray);">@${a.username} • ${ROLE_LABELS[a.role]}</div>
                        </div>
                        ${blocked
                            ? `<span style="font-size: 11px; color: var(--text-gray);">${reason}</span>`
                            : `<button class="btn-secondary" style="width: auto; margin: 0; padding: 6px 12px; font-size: 12px; color: #b91c1c;" onclick="removeStaff('${a.username}')">Remove</button>`}
                    </div>`;
            }).join('');
        }

        function addStaff() {
            const name = document.getElementById('newStaffName').value.trim();
            const user = document.getElementById('newStaffUser').value.trim().toLowerCase();
            const pass = document.getElementById('newStaffPass').value;
            const role = document.getElementById('newStaffRole').value;
            const err = document.getElementById('newStaffError');

            if (!name) return err.textContent = 'Enter a full name';
            if (!/^[a-z0-9_]{3,20}$/.test(user)) return err.textContent = 'Username: 3-20 letters, numbers or _';
            if (staffAccounts.some(a => a.username === user)) return err.textContent = 'That username is already taken';
            if (pass.length < 8) return err.textContent = 'Password must be at least 8 characters';

            staffAccounts.push({ username: user, name: name, password: pass, role: role });
            err.textContent = '';
            ['newStaffName', 'newStaffUser', 'newStaffPass'].forEach(id => document.getElementById(id).value = '');
            document.getElementById('newStaffRole').selectedIndex = 0;
            renderStaffList();
            alert(`Account @${user} created as ${ROLE_LABELS[role]}.`);
        }

        function removeStaff(username) {
            const target = staffAccounts.find(a => a.username === username);
            if (!target) return;
            if (currentStaff && target.username === currentStaff.username) return alert("You can't remove your own account.");
            const superCount = staffAccounts.filter(a => a.role === 'superadmin').length;
            if (target.role === 'superadmin' && superCount === 1) return alert('There must always be at least one Super Admin.');
            if (!confirm(`Remove ${target.name} (@${target.username})? They will no longer be able to log in.`)) return;

            staffAccounts = staffAccounts.filter(a => a.username !== username);
            renderStaffList();
        }

        function switchAdminTab(tabName) {
            if (!adminRole || !ROLE_TABS[adminRole].includes(tabName)) return;
            if (tabName !== 'pos') posStopScan();
            if (tabName === 'staff') renderStaffList();
            if (tabName === 'genres') renderCategories();
            if (tabName === 'tax') renderTax();
            document.querySelectorAll('.admin-panel').forEach(panel => panel.classList.remove('active'));
            document.getElementById(`${tabName}-panel`).classList.add('active');
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            const tab = adminTabEl(tabName);
            if (tab) tab.classList.add('active');
        }

        function approveItem(itemId) {
            alert(`✓ Listing "${itemId}" approved and published to marketplace!`);
            event.target.closest('.pending-item').style.opacity = '0.5';
            event.target.closest('.pending-item').style.pointerEvents = 'none';
        }

        function rejectItem(itemId) {
            const reason = prompt('Enter reason for rejection:');
            if (reason) {
                alert(`✕ Listing "${itemId}" rejected.\nReason: ${reason}\nStudent has been notified.`);
                event.target.closest('.pending-item').style.opacity = '0.5';
                event.target.closest('.pending-item').style.pointerEvents = 'none';
            }
        }

        function openStaffLogin() {
            renderAdmin();
            showScreen('admin', document.querySelector('[data-nav=profile]'));
        }

        function setCategory(btn) {
            document.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }

        // ----- Shared listing store (posted listings + POS read from here) -----
        const listings = [
            { barcode: 'CHI1234567', title: 'Statistics Textbook', price: 800, seller: 'Ali Santos', status: 'available' },
            { barcode: 'CHI7654321', title: 'IT3120 Notes', price: 250, seller: 'Maria Delos', status: 'available' }
        ];
        const BASE_ITEMS_SOLD = 24;
        let posItem = null;

        // ----- Barcode generation for the listing form -----
        let currentBarcode = null;
        function generateBarcode() {
            currentBarcode = 'CHI' + Math.random().toString().slice(2, 9);
            document.getElementById('barcodeText').textContent = currentBarcode;
            document.getElementById('barcodeBox').style.display = 'block';
            JsBarcode('#barcodeSvg', currentBarcode, { format: 'CODE128', width: 2, height: 50, displayValue: false });
        }

        // ----- Post listing: validate, save to store, go to success -----
        function postListing() {
            if (!buyerUser) {
                alert('Log in to post a listing');
                pendingBuyerAction = null;
                showScreen('buyer-login', document.querySelector('[data-nav=marketplace]'));
                return;
            }
            const title = document.getElementById('listingTitle').value.trim();
            const category = document.getElementById('listingCategory').value;
            const price = Number(document.getElementById('listingPrice').value);
            const condition = document.querySelector('input[name="condition"]:checked');

            if (!title) return alert('Enter an item title');
            if (!category) return alert('Choose a category');
            if (!(price > 0)) return alert('Enter a price');
            if (!condition) return alert('Choose a condition');
            if (!currentBarcode) return alert('Generate a barcode before posting');

            listings.push({
                barcode: currentBarcode,
                title: title,
                price: price,
                seller: 'Hemar Abian',
                status: 'available'
            });
            // Show the new item in Browse, with its own heart and details
            const categoryText = category;   // the genre name
            const catObj = categories.find(c => c.name === categoryText);
            const emoji = catObj ? catObj.emoji : '📦';
            const optionEl = condition.closest('.condition-option');
            const condText = optionEl.querySelector('.condition-label').textContent + ' • ' + optionEl.querySelector('.condition-desc').textContent;

            const card = document.createElement('div');
            card.className = 'listing-card';
            card.innerHTML = '<div class="listing-image" style="background: linear-gradient(135deg, #1e3a6e, #3b82f6);"></div>' +
                '<div class="listing-info">' +
                '<div class="listing-title"></div>' +
                '<div class="listing-condition"></div>' +
                '<div class="listing-price"></div>' +
                '<div class="listing-seller"><div class="seller-info"><div class="seller-avatar">HA</div><div class="seller-name">Hemar Abian</div></div></div>' +
                '<button class="listing-action">View Details</button>' +
                '</div>';
            card.querySelector('.listing-image').textContent = emoji;
            card.querySelector('.listing-title').textContent = title;
            card.querySelector('.listing-condition').textContent = condText;
            card.querySelector('.listing-price').textContent = '₱' + price.toLocaleString();
            document.getElementById('listingsGrid').prepend(card);

            const newly = document.createElement('div');
            newly.className = 'newly-added-card';
            newly.innerHTML = '<div class="trending-image" style="background: linear-gradient(135deg, #1e3a6e, #3b82f6);"></div>' +
                '<div class="trending-info"><h3></h3><p></p><div class="trending-price"></div>' +
                '<div style="font-size: 11px; color: var(--text-gray);">⭐ New • 👁️ 0 views</div></div>';
            newly.querySelector('.trending-image').textContent = emoji;
            newly.querySelector('h3').textContent = title;
            newly.querySelector('p').textContent = 'By: Hemar Abian • Just posted';
            newly.querySelector('.trending-price').textContent = '₱' + price.toLocaleString();
            const newlyRow = document.querySelector('.newly-added-scroll');
            if (newlyRow) newlyRow.prepend(newly);

            const sellerId = buyerUser.id;
            registerCard(card, { category: categoryText, sellerId: sellerId, sellerName: 'Hemar Abian' });
            registerCard(newly, { category: categoryText, sellerId: sellerId, sellerName: 'Hemar Abian' });
            addWishButtons();
            renderAll();

            alert('Listing posted!\nBarcode: ' + currentBarcode);

            // Reset the form for the next listing
            document.getElementById('listingTitle').value = '';
            document.getElementById('listingPrice').value = '';
            document.getElementById('listingCategory').selectedIndex = 0;
            document.getElementById('barcodeBox').style.display = 'none';
            currentBarcode = null;
            showScreen('marketplace', document.querySelector('[data-nav=marketplace]'));
        }

        // Drafts stay in memory; the form keeps its values until posted
        let draftCount = 0;
        function saveDraft() {
            const title = document.getElementById('listingTitle').value.trim();
            if (!title) return alert('Add an item title before saving a draft');
            draftCount++;
            alert('Draft saved: "' + title + '". Post it when you are ready.');
        }

        // ----- Categories, tax, item registry, filtering, seller notices -----
        let categories = [
            { name: 'Fiction', emoji: '📚', tax: 2 },
            { name: 'Science Textbooks', emoji: '📚', tax: 2 },
            { name: 'Programming Books', emoji: '📚', tax: 2 },
            { name: 'Lecture Notes', emoji: '📝', tax: 3 },
            { name: 'Exam Prep', emoji: '📝', tax: 3 },
            { name: 'Headphones', emoji: '🎧', tax: 8 },
            { name: 'Laptops & Computers', emoji: '🎧', tax: 8 },
            { name: 'Tutoring', emoji: '⭐', tax: 10 },
            { name: 'Writing Services', emoji: '⭐', tax: 10 },
            { name: 'Printing & Design', emoji: '⭐', tax: 10 }
        ];

        // Sample listings → category (anything not listed only shows under All Items)
        const CATEGORY_BY_TITLE = {
            'Wireless Earbuds Pro': 'Headphones',
            'Wireless Earbuds': 'Headphones',
            'Earbuds': 'Headphones',
            'Statistics Textbook': 'Science Textbooks',
            'Chemistry Textbook': 'Science Textbooks',
            'Python Tutoring': 'Tutoring',
            'IELTS Exam Prep Class': 'Tutoring',
            'Laptop Dell XPS': 'Laptops & Computers',
            'Laptop Dell XPS 13': 'Laptops & Computers',
            'Desktop Monitor LG 27"': 'Laptops & Computers',
            'IT3120 Midterm Notes': 'Exam Prep',
            'IT3120 Notes': 'Exam Prep',
            'Complete Notes - Calculus': 'Lecture Notes',
            'Thesis Writing Help': 'Writing Services'
        };

        // One entry per real item (same title + price), however many cards show it
        const registry = new Map();   // key -> { key, title, price, category, sellerId, sellerName, status, cards[] }
        const notices = [];           // { id, sellerId, sellerName, itemKey, itemTitle, oldCategory, open }
        let selectedCategory = null;  // null = All Items

        function categoryNamed(name) {
            return categories.find(c => c.name === name);
        }

        function sampleSellerName(data) {
            const byLine = data.details.find(d => d.startsWith('By:'));
            if (byLine) return byLine.replace(/^By:\s*/, '').split('•')[0].trim();
            return data.details.find(d => /^[A-Z][a-z]+ [A-Z][a-z]+/.test(d)) || 'Seller';
        }

        function registerCard(card, opts) {
            const data = getCardData(card);
            const key = itemKey(data);
            let entry = registry.get(key);
            if (!entry) {
                entry = {
                    key: key,
                    title: data.title,
                    price: data.price,
                    category: opts.category,
                    sellerId: opts.sellerId,
                    sellerName: opts.sellerName,
                    status: 'active',
                    cards: []
                };
                registry.set(key, entry);
            }
            entry.cards.push(card);
            card.dataset.key = key;
        }

        function registerSampleCards() {
            document.querySelectorAll('#marketplace .trending-card, #marketplace .newly-added-card, #marketplace .listing-card').forEach(card => {
                if (card.dataset.key) return;
                const data = getCardData(card);
                registerCard(card, {
                    category: CATEGORY_BY_TITLE[data.title] || null,
                    sellerId: 'sample:' + data.title,
                    sellerName: sampleSellerName(data)
                });
            });
        }

        function applyFilters() {
            let visibleGrid = 0;
            registry.forEach(entry => {
                const show = entry.status === 'active' && (!selectedCategory || entry.category === selectedCategory);
                entry.cards.forEach(card => {
                    card.style.display = show ? '' : 'none';
                    if (show && card.classList.contains('listing-card')) visibleGrid++;
                });
            });
            const empty = document.getElementById('genreEmpty');
            if (empty) empty.style.display = visibleGrid === 0 ? 'block' : 'none';
        }

        function renderPills() {
            const row = document.getElementById('categoryScroll');
            row.innerHTML = '';
            const items = [{ label: 'All Items', value: null }].concat(
                categories.map(c => ({ label: c.emoji + ' ' + c.name, value: c.name }))
            );
            items.forEach(item => {
                const btn = document.createElement('button');
                btn.className = 'cat-pill' + (selectedCategory === item.value ? ' active' : '');
                btn.textContent = item.label;
                btn.onclick = () => { selectedCategory = item.value; renderAll(); };
                row.appendChild(btn);
            });
        }

        function renderCreateOptions() {
            const select = document.getElementById('listingCategory');
            const current = select.value;
            select.innerHTML = '<option value="">-- Select category --</option>';
            categories.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.name;
                opt.textContent = c.emoji + ' ' + c.name;
                select.appendChild(opt);
            });
            if (categoryNamed(current)) select.value = current;
        }

        function renderCategories() {
            const list = document.getElementById('categoryList');
            document.getElementById('catCount').textContent = categories.length;
            list.innerHTML = '';
            categories.forEach((c, i) => {
                const row = document.createElement('div');
                row.className = 'genre-item';
                row.textContent = c.emoji + ' ' + c.name;
                const del = document.createElement('button');
                del.className = 'genre-delete';
                del.textContent = '✕';
                del.onclick = () => removeCategory(i);
                row.appendChild(del);
                list.appendChild(row);
            });
            renderNoticeLog();
        }

        function renderTax() {
            const list = document.getElementById('taxList');
            list.innerHTML = '';
            if (!categories.length) {
                list.textContent = 'No categories yet. Add one in the Categories tab.';
                return;
            }
            const grid = document.createElement('div');
            grid.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 12px;';
            categories.forEach(c => {
                const cell = document.createElement('div');
                const name = document.createElement('div');
                name.style.cssText = 'color: var(--text-gray); margin-bottom: 6px;';
                name.textContent = c.name;
                const input = document.createElement('input');
                input.type = 'number'; input.min = '0'; input.max = '100'; input.step = '0.5';
                input.value = c.tax;
                input.style.cssText = 'width: 100%; padding: 6px; background: var(--bg-white); border: 1px solid var(--border); border-radius: 4px; color: var(--text-dark);';
                input.onchange = () => { c.tax = Number(input.value) || 0; };
                cell.append(name, input);
                grid.appendChild(cell);
            });
            list.appendChild(grid);
        }

        function saveTax() {
            // Rates are stored as they're edited
            alert('Tax settings saved.');
        }

        function addCategory() {
            const name = document.getElementById('catName').value.trim();
            const tax = Number(document.getElementById('catTax').value) || 0;
            const err = document.getElementById('catError');
            if (!name) return err.textContent = 'Enter a category name';
            if (categoryNamed(name)) return err.textContent = 'That category already exists';
            categories.push({ name: name, emoji: '📦', tax: tax });
            err.textContent = '';
            document.getElementById('catName').value = '';
            document.getElementById('catTax').value = '0';
            renderAll();
        }

        function removeCategory(index) {
            const cat = categories[index];
            if (!cat) return;
            const affected = Array.from(registry.values()).filter(e => e.category === cat.name && e.status === 'active');
            showRemoveDialog(cat, index, affected);
        }

        function showRemoveDialog(cat, index, affected) {
            const overlay = document.createElement('div');
            overlay.id = 'catModal';
            overlay.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 16px;';

            const box = document.createElement('div');
            box.style.cssText = 'background: var(--bg-white); border-radius: 12px; padding: 20px; max-width: 360px; width: 100%; max-height: 80vh; overflow-y: auto;';

            const title = document.createElement('div');
            title.style.cssText = 'font-weight: 700; font-size: 15px; margin-bottom: 8px;';
            title.textContent = 'Remove "' + cat.name + '"?';

            const text = document.createElement('div');
            text.style.cssText = 'font-size: 13px; color: var(--text-gray); margin-bottom: 12px;';
            text.textContent = affected.length
                ? affected.length + ' listing(s) use this category. They will be hidden from Browse until each seller picks a new category, and each seller will be notified.'
                : 'No listings use this category. It will be removed.';

            box.append(title, text);

            if (affected.length) {
                const ul = document.createElement('div');
                ul.style.cssText = 'font-size: 12px; background: var(--bg-light); border-radius: 6px; padding: 10px; margin-bottom: 14px;';
                affected.forEach(e => {
                    const row = document.createElement('div');
                    row.style.marginBottom = '4px';
                    row.textContent = e.title + ' — ' + e.sellerName;
                    ul.appendChild(row);
                });
                box.appendChild(ul);
            }

            const actions = document.createElement('div');
            actions.style.cssText = 'display: flex; gap: 8px;';
            const cancel = document.createElement('button');
            cancel.className = 'btn-secondary';
            cancel.style.cssText = 'flex: 1; margin: 0;';
            cancel.textContent = 'Cancel';
            cancel.onclick = () => overlay.remove();
            const confirmBtn = document.createElement('button');
            confirmBtn.className = 'btn-primary';
            confirmBtn.style.cssText = 'flex: 1; margin: 0; background: #b91c1c;';
            confirmBtn.textContent = affected.length ? 'Remove & notify sellers' : 'Remove';
            confirmBtn.onclick = () => {
                confirmRemoveCategory(cat, index, affected);
                overlay.remove();
            };
            actions.append(cancel, confirmBtn);
            box.appendChild(actions);

            overlay.appendChild(box);
            document.body.appendChild(overlay);
        }

        function confirmRemoveCategory(cat, index, affected) {
            categories.splice(index, 1);
            if (selectedCategory === cat.name) selectedCategory = null;

            affected.forEach(e => {
                e.status = 'needs_category';
                e.category = null;
                notices.push({
                    id: Date.now() + Math.random(),
                    sellerId: e.sellerId,
                    sellerName: e.sellerName,
                    itemKey: e.key,
                    itemTitle: e.title,
                    oldCategory: cat.name,
                    open: true
                });
            });
            renderAll();
            alert('"' + cat.name + '" removed. ' + affected.length + ' seller(s) notified to choose a new category.');
        }

        function resolveNotice(id, newCategory) {
            const notice = notices.find(n => n.id === id);
            if (!notice || !newCategory) return;
            const entry = registry.get(notice.itemKey);
            if (entry) {
                entry.category = newCategory;
                entry.status = 'active';
            }
            notice.open = false;
            renderAll();
        }

        function renderNotifyBox() {
            const box = document.getElementById('notifyBox');
            box.innerHTML = '';
            if (!buyerUser) return;
            const mine = notices.filter(n => n.open && n.sellerId === buyerUser.id);
            if (!mine.length) return;

            const head = document.createElement('div');
            head.style.cssText = 'font-weight: 600; font-size: 13px; margin-bottom: 8px;';
            head.textContent = 'Action needed: choose a new category (' + mine.length + ')';
            box.appendChild(head);

            mine.forEach(n => {
                const card = document.createElement('div');
                card.style.cssText = 'background: var(--bg-white); border: 1px solid var(--border); border-radius: 8px; padding: 12px; margin-bottom: 8px; font-size: 12px;';
                const msg = document.createElement('div');
                msg.style.marginBottom = '8px';
                msg.textContent = 'The category "' + n.oldCategory + '" was removed. Please re-categorize "' + n.itemTitle + '" so buyers can find it.';
                const sel = document.createElement('select');
                sel.className = 'form-select';
                sel.style.marginBottom = '8px';
                const first = document.createElement('option');
                first.value = '';
                first.textContent = '-- Choose new category --';
                sel.appendChild(first);
                categories.forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = c.name;
                    opt.textContent = c.emoji + ' ' + c.name;
                    sel.appendChild(opt);
                });
                const save = document.createElement('button');
                save.className = 'btn-primary';
                save.style.margin = '0';
                save.textContent = 'Save category';
                save.onclick = () => {
                    if (!sel.value) return alert('Choose a new category first');
                    resolveNotice(n.id, sel.value);
                };
                card.append(msg, sel, save);
                box.appendChild(card);
            });
        }

        function renderNoticeLog() {
            const log = document.getElementById('notifyLog');
            if (!log) return;
            log.innerHTML = '';
            if (!notices.length) {
                log.textContent = 'No seller notices sent yet.';
                return;
            }
            notices.slice().reverse().forEach(n => {
                const row = document.createElement('div');
                row.style.cssText = 'background: var(--bg-light); border-radius: 6px; padding: 8px 10px; margin-bottom: 6px;';
                row.textContent = n.sellerName + ' • "' + n.itemTitle + '" (was ' + n.oldCategory + ') • ' + (n.open ? 'Waiting for new category' : 'Resolved');
                log.appendChild(row);
            });
        }

        function renderMyListings() {
            const box = document.getElementById('myListings');
            const title = document.getElementById('myListingsTitle');
            box.innerHTML = '';

            if (!buyerUser) {
                title.textContent = 'My Listings';
                const msg = document.createElement('div');
                msg.style.cssText = 'text-align: center; color: var(--text-gray); font-size: 13px; padding: 24px 8px;';
                msg.textContent = 'Log in to see your listings.';
                box.appendChild(msg);
                const btn = document.createElement('button');
                btn.className = 'btn-primary';
                btn.textContent = 'Log in';
                btn.onclick = openLoginFromProfile;
                box.appendChild(btn);
                return;
            }

            // Each real item appears once, even if several cards show it
            const mine = Array.from(registry.values()).filter(e => e.sellerId === buyerUser.id);
            title.textContent = 'My Listings (' + mine.length + ')';

            if (!mine.length) {
                const msg = document.createElement('div');
                msg.style.cssText = 'text-align: center; color: var(--text-gray); font-size: 13px; padding: 24px 8px;';
                msg.textContent = "You haven't posted any items yet. Tap + to post your first listing.";
                box.appendChild(msg);
                return;
            }

            mine.forEach(e => {
                const row = document.createElement('div');
                row.style.cssText = 'display: flex; align-items: center; gap: 12px; background: var(--bg-white); border: 1px solid var(--border); border-radius: 8px; padding: 10px; margin-bottom: 8px;';

                const img = document.createElement('div');
                const sample = e.cards[0] ? getCardData(e.cards[0]) : null;
                img.textContent = sample ? sample.emoji : '📦';
                img.style.cssText = 'width: 52px; height: 52px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 24px; background: #1e3a6e;';

                const info = document.createElement('div');
                info.style.cssText = 'flex: 1; min-width: 0;';
                const t = document.createElement('div');
                t.style.cssText = 'font-weight: 600; font-size: 13px;';
                t.textContent = e.title;
                const sub = document.createElement('div');
                sub.style.cssText = 'font-size: 11px; color: var(--text-gray);';
                sub.textContent = e.price + (e.category ? ' • ' + e.category : ' • No category');
                info.append(t, sub);

                const badge = document.createElement('span');
                const needs = e.status === 'needs_category';
                badge.textContent = needs ? 'Needs category' : 'Active';
                badge.style.cssText = 'font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 10px; color: #fff; background: ' + (needs ? '#f59e0b' : '#3b82f6') + ';';

                row.append(img, info, badge);
                box.appendChild(row);
            });
        }

        function openLoginFromProfile() {
            pendingBuyerAction = null;
            showScreen('buyer-login', document.querySelector('[data-nav=profile]'));
        }

        function renderProfileLock() {
            const logged = !!buyerUser;
            document.getElementById('profileLocked').style.display = logged ? 'none' : 'block';
            document.getElementById('profileOpen').style.display = logged ? 'block' : 'none';
            ['messages', 'wishlist'].forEach(id => {
                document.getElementById(id + 'Locked').style.display = logged ? 'none' : 'block';
                document.getElementById(id + 'Open').style.display = logged ? 'block' : 'none';
            });
        }

        function renderRatings() {
            const logged = !!buyerUser;
            document.getElementById('ratingsLocked').style.display = logged ? 'none' : 'block';
            document.getElementById('ratingsOpen').style.display = logged ? 'block' : 'none';
        }

        function renderAll() {
            renderProfileLock();
            renderRatings();
            renderCategories();
            renderTax();
            renderPills();
            renderCreateOptions();
            applyFilters();
            renderNotifyBox();
            renderMyListings();
        }

        // Run after every script on the page has loaded
        document.addEventListener('DOMContentLoaded', function () {
            registerSampleCards();
            renderAll();
        });

        // ----- POS (lives in the admin dashboard) -----
        function posSetError(id, msg) {
            document.getElementById(id).textContent = msg;
        }

        // ----- POS: type or scan with the camera (browser barcode reader, no library) -----
        let posStream = null;
        let posScanFrame = null;

        function posSetMode(mode) {
            posStopScan();
            const scanning = mode === 'scan';
            document.getElementById('posTypeRow').style.display = scanning ? 'none' : '';
            document.getElementById('posScanBox').hidden = !scanning;
            document.getElementById('posModeType').classList.toggle('active', !scanning);
            document.getElementById('posModeScan').classList.toggle('active', scanning);
            if (scanning) posStartScan();
            else document.getElementById('posInput').focus();
        }

        async function posStartScan() {
            const status = document.getElementById('posScanStatus');
            const video = document.getElementById('posVideo');
            if (!('BarcodeDetector' in window) || !navigator.mediaDevices || !window.isSecureContext) {
                status.textContent = 'Camera scanning needs HTTPS and a browser with barcode support (Chrome on Android). Type the code instead.';
                return;
            }
            try {
                const detector = new BarcodeDetector({ formats: ['code_128'] });
                posStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                video.srcObject = posStream;
                await video.play();
                status.textContent = 'Point the camera at the barcode';
                const scanFrame = async () => {
                    if (!posStream) return;
                    try {
                        const codes = await detector.detect(video);
                        if (codes.length) {
                            document.getElementById('posInput').value = codes[0].rawValue;
                            posSetMode('type');
                            posSearch();
                            return;
                        }
                    } catch (e) { /* frame not ready yet, try the next one */ }
                    posScanFrame = requestAnimationFrame(scanFrame);
                };
                scanFrame();
            } catch (e) {
                status.textContent = 'Could not open the camera. Check the camera permission, or type the code instead.';
            }
        }

        function posStopScan() {
            if (posScanFrame) cancelAnimationFrame(posScanFrame);
            posScanFrame = null;
            if (posStream) posStream.getTracks().forEach(track => track.stop());
            posStream = null;
            const video = document.getElementById('posVideo');
            if (video) video.srcObject = null;
        }

        function posSearch() {
            const code = document.getElementById('posInput').value.trim().toUpperCase();
            posSetError('posInputError', '');
            if (!code) return posSetError('posInputError', 'Enter a barcode');

            const item = listings.find(l => l.barcode === code);
            if (!item) {
                posSetError('posInputError', 'No item found with barcode ' + code);
                document.getElementById('posResult').style.display = 'none';
                posItem = null;
                return;
            }

            posItem = item;
            document.getElementById('posItemTitle').textContent = item.title;
            document.getElementById('posItemSeller').textContent = item.seller;
            document.getElementById('posItemBarcode').textContent = item.barcode;
            document.getElementById('posPrice').textContent = '₱' + item.price.toLocaleString();
            document.getElementById('posReceipt').style.display = 'none';

            const pill = document.getElementById('posStatus');
            if (item.status === 'sold') {
                pill.textContent = 'ALREADY SOLD';
                pill.style.background = '#fee2e2';
                pill.style.color = '#b91c1c';
                document.getElementById('posSaleBox').style.display = 'none';
            } else {
                pill.textContent = 'AVAILABLE';
                pill.style.background = '#dcfce7';
                pill.style.color = '#15803d';
                document.getElementById('posSaleBox').style.display = 'block';
                document.getElementById('posCash').value = '';
                posUpdateChange();
            }
            document.getElementById('posResult').style.display = 'block';
        }

        function posUpdateChange() {
            if (!posItem) return;
            const cash = Number(document.getElementById('posCash').value);
            const price = posItem.price;
            const enough = document.getElementById('posCash').value !== '' && cash >= price;
            document.getElementById('posChange').textContent = enough ? '₱' + (cash - price).toLocaleString() : '₱0';
            document.getElementById('posCompleteBtn').disabled = !enough;
            posSetError('posCashError',
                document.getElementById('posCash').value !== '' && cash < price
                    ? 'Cash is less than the price (₱' + price.toLocaleString() + ')' : '');
        }

        function posCompleteSale() {
            if (!posItem || posItem.status === 'sold') return;
            const cash = Number(document.getElementById('posCash').value);
            posSetError('posCashError', '');
            if (cash < posItem.price) return posSetError('posCashError', 'Cash is less than the price');

            const now = new Date();
            posItem.status = 'sold';
            posItem.soldAt = now;
            posItem.soldBy = currentStaff.username;

            document.getElementById('posReceiptLines').innerHTML =
                '<div><b>Item:</b> ' + posItem.title + '</div>' +
                '<div><b>Barcode:</b> ' + posItem.barcode + '</div>' +
                '<div><b>Seller:</b> ' + posItem.seller + '</div>' +
                '<div><b>Price:</b> ₱' + posItem.price.toLocaleString() + '</div>' +
                '<div><b>Cash:</b> ₱' + cash.toLocaleString() + '</div>' +
                '<div><b>Change:</b> ₱' + (cash - posItem.price).toLocaleString() + '</div>' +
                '<div><b>Cashier:</b> ' + currentStaff.name + '</div>' +
                '<div><b>Time:</b> ' + now.toLocaleString() + '</div>';

            document.getElementById('posSaleBox').style.display = 'none';
            document.getElementById('posStatus').textContent = '';
            document.getElementById('posStatus').style.background = 'transparent';
            document.getElementById('posReceipt').style.display = 'block';
            document.getElementById('posVoidBtn').style.display = adminRole === 'superadmin' ? 'block' : 'none';
        }

        function posVoid() {
            if (adminRole !== 'superadmin' || !posItem) return;
            const reason = prompt('Reason for voiding this sale (required):');
            if (!reason || !reason.trim()) return;
            voidLog.push({ barcode: posItem.barcode, title: posItem.title, reason: reason.trim(), by: currentStaff.username, at: new Date() });
            posItem.status = 'available';
            posItem.soldAt = null;
            alert('Sale voided and logged. The item is available again.');
            posReset();
        }

        function posReset() {
            posItem = null;
            document.getElementById('posInput').value = '';
            posSetError('posInputError', '');
            document.getElementById('posResult').style.display = 'none';
            document.getElementById('posReceipt').style.display = 'none';
            document.getElementById('posCash').value = '';
            document.getElementById('posInput').focus();
        }

        // ----- Buyer: item details, inquire, buy now (login required) -----
        // Demo buyer accounts. A real app checks these on the server.
        // Demo accounts. A real app stores these on the server with hashed passwords.
        const INSTITUTION_DOMAIN = '@isufst.edu.ph';
        const buyerAccounts = [
            { type: 'student', id: '24-00200', email: 'hemar@example.com', password: 'hemar1234', verified: true },
            { type: 'teacher', id: null, email: 'teacher@isufst.edu.ph', password: 'teacher123', verified: true }
        ];
        let buyerUser = null;
        let pendingBuyerAction = null;
        let currentItem = null;
        let pendingVerification = null;   // account waiting for email verification

        // Open details when a card or its View Details button is tapped
        document.getElementById('marketplace').addEventListener('click', function (e) {
            const heart = e.target.closest('.wish-btn');
            if (heart) {
                e.stopPropagation();
                toggleWishlist(heart.closest('.trending-card, .newly-added-card, .listing-card'));
                return;
            }
            const card = e.target.closest('.trending-card, .newly-added-card, .listing-card');
            if (card) openItemDetail(card);
        });

        function getCardData(card) {
            const imageEl = card.querySelector('[class*="image"]');
            const titleEl = card.querySelector('[class*="title"]') || card.querySelector('h3');
            const priceEl = card.querySelector('[class*="price"]') ||
                Array.from(card.querySelectorAll('div, span, p')).find(el => el.children.length === 0 && /₱/.test(el.textContent));
            const title = titleEl ? titleEl.textContent.trim() : 'Item';
            const price = priceEl ? priceEl.textContent.trim() : '';

            // Every other text line on the card becomes a detail row (seller, condition, rating, views)
            const details = Array.from(card.querySelectorAll('*'))
                .filter(el => el.children.length === 0 && !el.closest('.wish-btn'))
                .map(el => el.textContent.trim())
                .filter(t => t && t !== title && t !== price && t !== 'View Details');

            return {
                title,
                price,
                details,
                emoji: imageEl ? imageEl.textContent.trim() : '📦',
                imageStyle: imageEl ? (imageEl.getAttribute('style') || '') : ''
            };
        }

        function openItemDetail(card) {
            showItemDetail(getCardData(card));
        }

        function showItemDetail(data) {
            currentItem = data;

            const img = document.getElementById('itemImage');
            img.textContent = data.emoji;
            img.setAttribute('style', data.imageStyle + ';font-size: 64px; text-align: center; padding: 36px 0; border-radius: 12px; margin: 16px 0;' + (data.imageStyle.includes('background') ? '' : ' background: #1e3a6e;'));

            document.getElementById('itemTitle').textContent = data.title;
            document.getElementById('itemPrice').textContent = data.price;

            const list = document.getElementById('itemDetails');
            list.innerHTML = '';
            data.details.forEach(text => {
                const row = document.createElement('div');
                row.textContent = text;
                list.appendChild(row);
            });

            showScreen('item-detail', document.querySelector('[data-nav=marketplace]'));
        }

        function requireBuyer(action) {
            if (!buyerUser) {
                pendingBuyerAction = action;
                document.getElementById('buyerLoginTitle').textContent =
                    action === 'buy' ? 'Log in to buy now' : 'Log in to inquire';
                document.getElementById('buyerId').value = '';
                document.getElementById('buyerPass').value = '';
                document.getElementById('buyerLoginError').textContent = '';
                showScreen('buyer-login', document.querySelector('[data-nav=marketplace]'));
                return;
            }
            runBuyerAction(action);
        }

        function runBuyerAction(action) {
            if (!currentItem) return;
            if (action === 'inquire') {
                alert('Your inquiry about "' + currentItem.title + '" was sent to the seller. Follow up in Messages.');
            } else if (action === 'buy') {
                if (confirm('Buy "' + currentItem.title + '" for ' + currentItem.price + '?\nThe seller will confirm and you will meet on campus.')) {
                    alert('Purchase request sent to the seller.');
                }
            }
        }

        function buyerLogin() {
            const input = document.getElementById('buyerId').value.trim();
            const pass = document.getElementById('buyerPass').value;
            const err = document.getElementById('buyerLoginError');

            // Staff accounts use the same form and go to the staff dashboard
            const staff = staffAccounts.find(a => a.username === input.toLowerCase() && a.password === pass);
            if (staff) {
                err.textContent = '';
                document.getElementById('buyerPass').value = '';
                currentStaff = { username: staff.username, name: staff.name, role: staff.role };
                adminRole = staff.role;
                pendingBuyerAction = null;
                renderAdmin();
                showScreen('admin', document.querySelector('[data-nav=profile]'));
                return;
            }
            const account = buyerAccounts.find(a =>
                (a.id && a.id === input) || a.email === input.toLowerCase()
            );

            if (!account || account.password !== pass) {
                err.textContent = 'Invalid ID/email or password';
                return;
            }
            if (!account.verified) {
                err.textContent = 'Verify your email first. We sent a link to ' + account.email + '.';
                pendingVerification = account;
                return;
            }
            err.textContent = '';
            buyerUser = { id: account.id || account.email, type: account.type };
            renderAll();
            document.getElementById('buyerPass').value = '';
            const action = pendingBuyerAction;
            pendingBuyerAction = null;
            if (action) {
                showScreen('item-detail', document.querySelector('[data-nav=marketplace]'));
                runBuyerAction(action);
            } else {
                showScreen('profile', document.querySelector('[data-nav=profile]'));
            }
        }

        function toggleSignupType() {
            const teacher = document.getElementById('signupType').value === 'teacher';
            document.getElementById('signupIdBox').style.display = teacher ? 'none' : 'block';
            document.getElementById('signupEmailLabel').textContent = teacher ? 'ISUFST email *' : 'Email (for notifications) *';
            document.getElementById('signupEmailHint').textContent = teacher
                ? 'Use your institutional email, ending in ' + INSTITUTION_DOMAIN + '.'
                : 'Any email works, including Gmail.';
        }

        function signupBuyer() {
            const type = document.getElementById('signupType').value;
            const id = document.getElementById('signupId').value.trim();
            const email = document.getElementById('signupEmail').value.trim().toLowerCase();
            const pass = document.getElementById('signupPass').value;
            const pass2 = document.getElementById('signupPass2').value;
            const err = document.getElementById('signupError');

            if (type === 'student') {
                if (!/^\d{2}-\d{5}$/.test(id)) return err.textContent = 'Enter a valid student ID (e.g. 24-00200)';
                if (buyerAccounts.some(a => a.id === id)) return err.textContent = 'An account with this student ID already exists';
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err.textContent = 'Enter a valid email address';
            if (type === 'teacher' && !email.endsWith(INSTITUTION_DOMAIN)) return err.textContent = 'Teachers must use an ISUFST email ending in ' + INSTITUTION_DOMAIN;
            if (buyerAccounts.some(a => a.email === email)) return err.textContent = 'That email is already used by another account';
            if (pass.length < 8) return err.textContent = 'Password must be at least 8 characters';
            if (pass !== pass2) return err.textContent = 'Passwords do not match';

            const account = { type: type, id: type === 'student' ? id : null, email: email, password: pass, verified: false };
            buyerAccounts.push(account);
            pendingVerification = account;
            err.textContent = '';
            ['signupId', 'signupEmail', 'signupPass', 'signupPass2'].forEach(f => document.getElementById(f).value = '');
            document.getElementById('verifyEmail').textContent = account.email;
            showScreen('buyer-verify', document.querySelector('[data-nav=marketplace]'));
        }

        function openVerificationLink() {
            if (!pendingVerification) return;
            // In a real app this link is opened from the email and calls the server
            pendingVerification.verified = true;
            alert('Email verified! You can now log in with your student ID.');
            pendingVerification = null;
            document.getElementById('buyerLoginError').textContent = '';
            showScreen('buyer-login', document.querySelector('[data-nav=marketplace]'));
        }

        function resendVerification() {
            if (!pendingVerification) return;
            alert('A new verification link was sent to ' + pendingVerification.email + '.');
        }

        function cancelBuyerLogin() {
            const fromItem = !!pendingBuyerAction;
            pendingBuyerAction = null;
            if (fromItem) showScreen('item-detail', document.querySelector('[data-nav=marketplace]'));
            else showScreen('profile', document.querySelector('[data-nav=profile]'));
        }

        // ----- Wishlist (bookmarks) -----
        const wishlist = new Map();   // key -> item data

        function itemKey(data) {
            return data.title + '|' + data.price;
        }

        function toggleWishlist(card) {
            if (!card) return;
            const data = getCardData(card);
            const key = itemKey(data);
            if (wishlist.has(key)) wishlist.delete(key);
            else wishlist.set(key, data);
            refreshWishButtons();
            renderWishlist();
        }

        function removeFromWishlist(key) {
            wishlist.delete(key);
            refreshWishButtons();
            renderWishlist();
        }

        function refreshWishButtons() {
            document.querySelectorAll('.wish-btn').forEach(btn => {
                const saved = wishlist.has(btn.dataset.key);
                btn.textContent = saved ? '♥' : '♡';
                btn.style.color = saved ? '#ef4444' : '#fff';
                btn.setAttribute('aria-pressed', saved ? 'true' : 'false');
                btn.setAttribute('aria-label', saved ? 'Remove from wishlist' : 'Save to wishlist');
            });
        }

        function renderWishlist() {
            const grid = document.getElementById('wishlistGrid');
            const empty = document.getElementById('wishlistEmpty');
            document.getElementById('wishlistTitle').textContent = '❤️ My Wishlist (' + wishlist.size + ' item' + (wishlist.size === 1 ? '' : 's') + ')';
            grid.innerHTML = '';
            empty.style.display = wishlist.size ? 'none' : 'block';

            wishlist.forEach((data, key) => {
                const card = document.createElement('div');
                card.className = 'wishlist-card';

                const img = document.createElement('div');
                img.className = 'wishlist-image';
                img.textContent = data.emoji;
                img.setAttribute('style', data.imageStyle);

                const info = document.createElement('div');
                info.className = 'wishlist-info';
                const title = document.createElement('div');
                title.style.fontWeight = '600';
                title.textContent = data.title;
                const price = document.createElement('div');
                price.style.color = 'var(--success)';
                price.textContent = data.price;

                const view = document.createElement('button');
                view.className = 'btn-secondary';
                view.style.cssText = 'width: 100%; margin: 8px 0 4px; padding: 8px;';
                view.textContent = 'View';
                view.onclick = () => showItemDetail(data);

                const remove = document.createElement('button');
                remove.className = 'btn-secondary';
                remove.style.cssText = 'width: 100%; margin: 0; padding: 8px; color: #b91c1c;';
                remove.textContent = 'Remove';
                remove.onclick = () => removeFromWishlist(key);

                info.append(title, price, view, remove);
                card.append(img, info);
                grid.appendChild(card);
            });
        }

        // Add the heart button to every card, then sync states
        function addWishButtons() {
            document.querySelectorAll('.trending-card, .newly-added-card, .listing-card').forEach(card => {
                if (card.querySelector('.wish-btn')) return;
                const data = getCardData(card);
                const btn = document.createElement('button');
                btn.className = 'wish-btn';
                btn.dataset.key = itemKey(data);
                btn.textContent = '♡';
                btn.setAttribute('aria-label', 'Save to wishlist');
                btn.style.cssText = 'position:absolute; top:8px; left:8px; z-index:1; width:32px; height:32px; border-radius:50%; border:none; background:rgba(0,0,0,0.45); color:#fff; font-size:17px; line-height:1; cursor:pointer; display:flex; align-items:center; justify-content:center; padding:0;';
                card.style.position = 'relative';
                card.appendChild(btn);
            });
            refreshWishButtons();
        }

        addWishButtons();
        document.querySelector('[data-nav=wishlist]').addEventListener('click', renderWishlist);
        renderWishlist();
