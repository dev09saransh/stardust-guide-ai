import re

with open('/Volumes/ssd/coc/frontend/src/pages/Dashboard/DashboardPage.jsx', 'r') as f:
    content = f.read()

new_profile = """              <div className="bg-[var(--surface-glass)] rounded-2xl p-4 flex items-center justify-between border border-[var(--border)] hover:bg-[var(--surface)] transition-all">
                <div
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center space-x-3 cursor-pointer flex-1 min-w-0"
                >
                  <div className="w-10 h-10 rounded-xl bg-[var(--bg-app)] flex items-center justify-center text-[var(--primary)] font-bold uppercase flex-shrink-0 border border-[var(--border)]">
                    {activeAccountId
                      ? inheritedAccounts.find(a => a.user_id === activeAccountId)?.full_name?.slice(0, 2)
                      : user?.user?.name ? user.user.name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'JD'}
                  </div>
                  <div className="truncate flex-1">
                    <p className="text-sm font-bold text-[var(--text-primary)] truncate">
                      {activeAccountId
                        ? inheritedAccounts.find(a => a.user_id === activeAccountId)?.full_name
                        : user?.user?.name || user?.user?.full_name || 'User'}
                    </p>
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none mt-1">
                      {activeAccountId ? 'INHERITED VIEW' : (user?.user?.role || 'CUSTOMER')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-glass)] p-2 rounded-xl transition-all flex-shrink-0 ml-2 border border-transparent"
                >
                  <LogOut size={16} />
                </button>
              </div>"""

old_profile_regex = re.compile(r'              <div className="bg-\[#111827\].*?                </button>\n              </div>', re.DOTALL)

content = old_profile_regex.sub(new_profile, content)

with open('/Volumes/ssd/coc/frontend/src/pages/Dashboard/DashboardPage.jsx', 'w') as f:
    f.write(content)

