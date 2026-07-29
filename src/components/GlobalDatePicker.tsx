import { useState, useEffect, forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar, ChevronDown, ArrowRight } from 'lucide-react';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, parseISO } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { useGlobalStore } from '../store/globalStore';

// Add some custom CSS overrides for react-datepicker to match the dark/light theme of Gulliver
const customStyles = `
  .react-datepicker-popper {
    z-index: 9999 !important;
  }
  .gv-datepicker-wrapper .react-datepicker {
    background-color: var(--gv-surface);
    border: 1px solid var(--gv-border);
    font-family: inherit;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  }
  .gv-datepicker-wrapper .react-datepicker__header {
    background-color: var(--gv-surface-alt);
    border-bottom: 1px solid var(--gv-border);
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
  }
  .gv-datepicker-wrapper .react-datepicker__current-month, 
  .gv-datepicker-wrapper .react-datepicker-time__header, 
  .gv-datepicker-wrapper .react-datepicker-year-header {
    color: var(--gv-text-heading);
  }
  .gv-datepicker-wrapper .react-datepicker__day-name, 
  .gv-datepicker-wrapper .react-datepicker__day, 
  .gv-datepicker-wrapper .react-datepicker__time-name {
    color: var(--gv-text);
  }
  .gv-datepicker-wrapper .react-datepicker__day:hover, 
  .gv-datepicker-wrapper .react-datepicker__month-text:hover, 
  .gv-datepicker-wrapper .react-datepicker__quarter-text:hover, 
  .gv-datepicker-wrapper .react-datepicker__year-text:hover {
    background-color: var(--gv-border);
  }
  .gv-datepicker-wrapper .react-datepicker__day--selected, 
  .gv-datepicker-wrapper .react-datepicker__day--in-selecting-range, 
  .gv-datepicker-wrapper .react-datepicker__day--in-range, 
  .gv-datepicker-wrapper .react-datepicker__month-text--selected, 
  .gv-datepicker-wrapper .react-datepicker__quarter-text--selected, 
  .gv-datepicker-wrapper .react-datepicker__year-text--selected {
    background-color: var(--gv-primary);
    color: #fff;
  }
  .gv-datepicker-wrapper .react-datepicker__day--keyboard-selected, 
  .gv-datepicker-wrapper .react-datepicker__month-text--keyboard-selected, 
  .gv-datepicker-wrapper .react-datepicker__quarter-text--keyboard-selected, 
  .gv-datepicker-wrapper .react-datepicker__year-text--keyboard-selected {
    background-color: var(--gv-primary);
    opacity: 0.8;
  }
`;

export default function GlobalDatePicker({ isTablet, singleDateOnly }: { isTablet: boolean; singleDateOnly?: boolean }) {
  const { t, i18n } = useTranslation();
  const { globalDateRange, setDateRange } = useGlobalStore();
  const isSpanish = i18n.language === 'es';
  const currentLocale = isSpanish ? es : enUS;

  const [dateRange, setLocalRange] = useState<[Date | null, Date | null]>([
    globalDateRange.startDate ? parseISO(globalDateRange.startDate) : null,
    globalDateRange.endDate ? parseISO(globalDateRange.endDate) : null
  ]);
  const [startDate, endDate] = dateRange;

  const isCustom = globalDateRange.preset === 'custom';
  const isInvalid = isCustom && (!startDate || !endDate || startDate > endDate);

  // Sync internal state if global state changes externally
  useEffect(() => {
    if (globalDateRange.startDate && globalDateRange.endDate) {
      setLocalRange([parseISO(globalDateRange.startDate), parseISO(globalDateRange.endDate)]);
    }
  }, [globalDateRange.startDate, globalDateRange.endDate]);

  // If singleDateOnly is enabled and the current preset is a range, reset to today
  useEffect(() => {
    if (singleDateOnly && (globalDateRange.preset === 'week' || globalDateRange.preset === 'month')) {
      const now = new Date();
      const str = format(now, 'yyyy-MM-dd');
      setDateRange({ startDate: str, endDate: str, preset: 'today' });
      setLocalRange([now, now]);
    }
  }, [singleDateOnly, globalDateRange.preset, setDateRange]);

  const handlePresetChange = (preset: string) => {
    if (preset === 'custom') {
      setDateRange({ ...globalDateRange, preset: 'custom' });
      return;
    }

    const now = new Date();
    let start = now;
    let end = now;

    if (preset === 'week') {
      start = startOfWeek(now, { weekStartsOn: 1 }); // Monday
      end = endOfWeek(now, { weekStartsOn: 1 });
    } else if (preset === 'month') {
      start = startOfMonth(now);
      end = endOfMonth(now);
    } else if (preset === 'today') {
      start = now;
      end = now;
    }

    const startStr = format(start, 'yyyy-MM-dd');
    const endStr = format(end, 'yyyy-MM-dd');
    
    setDateRange({ startDate: startStr, endDate: endStr, preset: preset as any });
    setLocalRange([start, end]);
  };

  const handleDateChange = (dates: any) => {
    const isRangeSelection = isCustom && !singleDateOnly;
    if (isRangeSelection) {
      const [start, end] = dates as [Date | null, Date | null];
      setLocalRange([start, end]);
      if (start && end) {
        setDateRange({
          startDate: format(start, 'yyyy-MM-dd'),
          endDate: format(end, 'yyyy-MM-dd'),
          preset: 'custom'
        });
      }
    } else {
      const date = dates as Date | null;
      if (date) {
        setLocalRange([date, date]);
        setDateRange({
          startDate: format(date, 'yyyy-MM-dd'),
          endDate: format(date, 'yyyy-MM-dd'),
          preset: 'custom'
        });
      }
    }
  };

  let displayValue = "";
  if (isCustom && !singleDateOnly) {
    if (startDate && endDate) {
      displayValue = `${format(startDate, "MMM d, yyyy", { locale: currentLocale })}|||${format(endDate, "MMM d, yyyy", { locale: currentLocale })}`;
    } else if (startDate) {
      displayValue = `${format(startDate, "MMM d, yyyy", { locale: currentLocale })}|||`;
    }
  } else {
    // Single date or today/week/month (which are single-string displays or ranges that are already valid)
    if (startDate && endDate) {
      if (startDate.getTime() === endDate.getTime() || singleDateOnly) {
        displayValue = format(startDate, "MMM d, yyyy", { locale: currentLocale });
      } else {
        displayValue = `${format(startDate, "MMM d", { locale: currentLocale })} - ${format(endDate, "MMM d, yyyy", { locale: currentLocale })}`;
      }
    }
  }

  const selectStyle: React.CSSProperties = {
    appearance: 'none',
    background: 'var(--gv-surface-alt)',
    border: '1px solid',
    borderColor: isInvalid ? '#ef4444' : 'var(--gv-border)',
    borderRadius: '8px 0 0 8px',
    padding: '12px 30px 12px 16px',
    color: 'var(--gv-text-heading)',
    fontSize: 16,
    fontWeight: 600,
    fontFamily: 'inherit',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    borderRight: 'none',
  };

  const CustomInput = forwardRef<HTMLButtonElement, any>(({ value, onClick, ...props }, ref) => {
    const parts = value ? value.split('|||') : [];
    const isRangeSelection = isCustom && !singleDateOnly;
    
    return (
      <button 
        type="button"
        onClick={onClick} 
        ref={ref}
        {...props}
        style={{
          appearance: 'none',
          background: 'var(--gv-surface-alt)',
          border: '1px solid',
          borderColor: isInvalid ? '#ef4444' : 'var(--gv-border)',
          borderTopRightRadius: 8,
          borderBottomRightRadius: 8,
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 0,
          padding: '12px 18px 12px 36px',
          color: isInvalid ? '#ef4444' : 'var(--gv-text-heading)',
          fontSize: 16,
          fontWeight: 600,
          fontFamily: 'inherit',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          width: isTablet ? 180 : (isRangeSelection ? 240 : 210),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: '8px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          outline: 'none',
        }}
      >
        {isRangeSelection && parts.length > 1 ? (
          <>
            <span>{parts[0]}</span>
            <ArrowRight size={14} style={{ color: isInvalid ? '#ef4444' : 'var(--gv-text-muted)' }} />
            <span>{parts[1] || '...'}</span>
          </>
        ) : (
          <span>{value || t('dateRange.placeholder', 'Seleccionar fecha')}</span>
        )}
      </button>
    );
  });

  return (
    <>
      <style>{customStyles}</style>
      <div>
        <div style={{
          fontSize: 12,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: isInvalid ? '#ef4444' : 'var(--gv-text-muted)',
          fontWeight: 700,
          marginBottom: 6,
          transition: 'color 0.2s ease',
        }}>
          {t('common.date', 'Fecha')}
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {/* Preset Selector */}
          <div style={{ position: 'relative' }}>
            <select
              style={selectStyle}
              value={globalDateRange.preset}
              onChange={(e) => handlePresetChange(e.target.value)}
            >
              <option value="today">{t('dateRange.today', 'Hoy')}</option>
              {!singleDateOnly && <option value="week">{t('dateRange.week', 'Esta Semana')}</option>}
              {!singleDateOnly && <option value="month">{t('dateRange.month', 'Este Mes')}</option>}
              <option value="custom">{t('dateRange.custom', 'Personalizado')}</option>
            </select>
            <ChevronDown size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gv-text-muted)', pointerEvents: 'none' }} />
          </div>

          {/* Range Picker */}
          <div className="gv-datepicker-wrapper" style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: isInvalid ? '#ef4444' : 'var(--gv-text-muted)', zIndex: 10, pointerEvents: 'none' }}>
              <Calendar size={16} />
            </div>
            {/* @ts-expect-error - react-datepicker types don't support dynamic boolean for selectsRange */}
            <DatePicker
              selectsRange={isCustom && !singleDateOnly}
              startDate={startDate || undefined}
              endDate={singleDateOnly ? undefined : (endDate || undefined)}
              selected={!isCustom || singleDateOnly ? (startDate || undefined) : undefined}
              onChange={handleDateChange}
              locale={currentLocale}
              dateFormat="MMM d, yyyy"
              value={displayValue}
              placeholderText={t('dateRange.placeholder', 'Seleccionar fecha')}
              className="gv-datepicker-input"
              wrapperClassName="gv-datepicker-container"
              customInput={<CustomInput />}
              popperPlacement="bottom-start"
              portalId="root"
              popperClassName="gv-datepicker-wrapper"
            />
          </div>
        </div>
      </div>
    </>
  );
}
