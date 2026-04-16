import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { LogOut, User as UserIcon, Settings } from 'lucide-react';

interface SidebarUserSectionProps {
  user: {
    name: string;
    dept: string;
    role: string;
  };
  onLogout: () => void;
  collapsed: boolean;
}

export default function SidebarUserSection({ user, onLogout, collapsed }: SidebarUserSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="px-3 mb-4" style={{ paddingLeft: collapsed ? 8 : 16, paddingRight: collapsed ? 8 : 16, transition: 'padding 0.3s' }}>
      <motion.div
        layout
        style={{ padding: 8 }}
        className="relative group rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
      >
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          {/* Avatar / Icon */}
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
              <UserIcon size={20} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-[#0f172a] rounded-full" />
          </div>

          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-1 min-w-0"
            >
              <h4 
                className="text-sm font-bold text-white truncate leading-tight"
                title={user.name}
              >
                {user.name}
              </h4>
              <div className="flex flex-col">
                 <span 
                   className="text-[10px] font-bold text-blue-400 uppercase tracking-wider truncate"
                   title={user.dept}
                 >
                  {user.dept}
                </span>
                <span 
                  className="text-[11px] text-slate-400 truncate"
                  title={user.role}
                >
                  {user.role}
                </span>
              </div>
            </motion.div>
          )}

          {!collapsed && (
            <motion.button
              whileHover={{ scale: 1.1, color: '#ef4444' }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onLogout();
              }}
              className="p-1.5 text-slate-500 hover:bg-red-500/10 rounded-lg transition-colors group/logout"
              title={t('user.logout')}
            >
              <LogOut size={16} />
            </motion.button>
          )}
        </div>

        {/* Popover on hover when collapsed */}
        {collapsed && (
          <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-200 z-50 transform translate-x-2 group-hover:translate-x-0">
            <div className="bg-[#1e293b] border border-white/10 p-3 rounded-xl shadow-2xl min-w-[180px] backdrop-blur-md">
              <div className="px-1 py-1 mb-2 border-b border-white/10 pb-3">
                <div className="text-sm font-bold text-white mb-0.5">{user.name}</div>
                <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{user.dept}</div>
                <div className="text-[11px] text-slate-400 mt-1">{user.role}</div>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onLogout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
              >
                <LogOut size={14} />
                {t('user.logout')}
              </button>
              
              {/* Arrow */}
              <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-[#1e293b] border-l border-b border-white/10 rotate-45" />
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
