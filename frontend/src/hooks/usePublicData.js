import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

/**
 * Public data hook for landing page - fetches live data without auth
 */
export function usePublicData() {
    const [discoveries, setDiscoveries] = useState([]);
    const [agentLogs, setAgentLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Listen to Discoveries (public)
    useEffect(() => {
        const discRef = collection(db, 'discoveries');
        const q = query(discRef, orderBy('createdAt', 'desc'), limit(20));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const discs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setDiscoveries(discs);
            setLoading(false);
        }, (err) => {
            console.error('Public discoveries listener error:', err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Listen to Agent Logs (public)
    useEffect(() => {
        const logsRef = collection(db, 'agent_logs');
        const q = query(logsRef, orderBy('createdAt', 'desc'), limit(15));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const logs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                time: doc.data().createdAt?.toDate?.().toLocaleTimeString([], { hour12: false }) || '...'
            }));
            setAgentLogs(logs);
        }, (err) => {
            console.error('Public agent logs listener error:', err);
        });

        return () => unsubscribe();
    }, []);

    return { discoveries, agentLogs, loading };
}
