import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Loader from './Loader';
import { useGlobalStore } from '../store/globalStore';

export default function GlobalLoader() {
  const { t } = useTranslation();
  const { isGlobalLoading, globalLoadingText } = useGlobalStore();

  return (
    <AnimatePresence>
      {isGlobalLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(3px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "var(--gv-surface)",
              padding: 24,
              borderRadius: 16,
              boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
            }}
          >
            <Loader text={globalLoadingText || t("common.loading", "Procesando...")} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
