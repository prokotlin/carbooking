
import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from './components/Layout';
import { BookingList } from './components/BookingList';
import { AddBookingModal } from './components/AddBookingModal';
import { NotificationPanel } from './components/NotificationPanel';
import { BookingFullDialog } from './components/BookingFullDialog';
import { Booking, BookingTab } from './types';
import { Plus } from 'lucide-react';

const STORAGE_KEY = 'car_booking_manager_data';

const App: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<BookingTab>('active');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [fullBookingError, setFullBookingError] = useState<{ date: string; shift: string } | null>(null);

  // Load bookings from local storage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setBookings(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse bookings", e);
      }
    }
  }, []);

  // Save bookings to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  }, [bookings]);

  const addBooking = (newBooking: Omit<Booking, 'id' | 'createdAt'>) => {
    const isDuplicate = bookings.some(
      (b) => b.date === newBooking.date && b.shift === newBooking.shift
    );

    if (isDuplicate) {
      setFullBookingError({ date: newBooking.date, shift: newBooking.shift });
      return;
    }

    const booking: Booking = {
      ...newBooking,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    setBookings((prev) => [...prev, booking]);
    setIsModalOpen(false);
  };

  const deleteBooking = (id: string) => {
    setBookings((prev) => prev.filter((b) => b.id !== id));
  };

  const updateAdvancePayment = (id: string, newAdvance: number) => {
    setBookings((prev) => prev.map((b) => {
      if (b.id === id) {
        return {
          ...b,
          advancePayment: newAdvance,
          duePayment: Math.max(0, b.totalPayment - newAdvance)
        };
      }
      return b;
    }));
  };

  const { activeBookings, expiredBookings, todayBookings } = useMemo(() => {
    // Get local date string in YYYY-MM-DD format
    const todayStr = new Date().toLocaleDateString('en-CA');
    
    const active: Booking[] = [];
    const expired: Booking[] = [];
    const forToday: Booking[] = [];

    bookings.forEach((b) => {
      if (b.date < todayStr) {
        expired.push(b);
      } else {
        active.push(b);
        if (b.date === todayStr) {
          forToday.push(b);
        }
      }
    });

    // Sort active: closest date first, then Day shift before Night shift
    active.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.shift === 'day' ? -1 : 1;
    });

    // Sort expired: newest date first, then Night shift before Day shift
    expired.sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return a.shift === 'night' ? -1 : 1;
    });

    return { activeBookings: active, expiredBookings: expired, todayBookings: forToday };
  }, [bookings]);

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      notificationCount={todayBookings.length}
      onNotificationClick={() => setShowNotifications(!showNotifications)}
    >
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {activeTab === 'active' ? 'Upcoming Bookings' : 'Booking History'}
            </h1>
            <p className="text-slate-500 mt-1">
              {activeTab === 'active' 
                ? `${activeBookings.length} scheduled trips` 
                : `${expiredBookings.length} completed trips`}
            </p>
          </div>
          {activeTab === 'active' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-blue-200"
            >
              <Plus size={20} />
              Add Booking
            </button>
          )}
        </div>

        <BookingList 
          bookings={activeTab === 'active' ? activeBookings : expiredBookings} 
          onDelete={deleteBooking}
          onUpdatePayment={updateAdvancePayment}
          isExpired={activeTab === 'expired'}
        />

        {isModalOpen && (
          <AddBookingModal 
            onClose={() => setIsModalOpen(false)} 
            onSave={addBooking} 
          />
        )}

        {showNotifications && (
          <NotificationPanel 
            todayBookings={todayBookings} 
            onClose={() => setShowNotifications(false)} 
          />
        )}

        {fullBookingError && (
          <BookingFullDialog 
            date={fullBookingError.date}
            shift={fullBookingError.shift}
            onClose={() => setFullBookingError(null)}
          />
        )}
      </div>
    </Layout>
  );
};

export default App;
