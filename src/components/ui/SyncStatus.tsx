'use client'

import { useEffect, useState } from 'react'
import { getSyncQueue, SyncTask, removeFromSyncQueue, updateTaskStatus } from '@/lib/sync/offlineStore'
import { createInboundEntry } from '@/actions/inbound'

export function SyncStatus() {
  const [queue, setQueue] = useState<SyncTask[]>([])
  const [isOnline, setIsOnline] = useState(true)

  const loadQueue = async () => {
    const q = await getSyncQueue()
    setQueue(q)
  }

  useEffect(() => {
    setIsOnline(navigator.onLine)
    
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Poll queue periodically
    const interval = setInterval(loadQueue, 2000)
    loadQueue()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    const processQueue = async () => {
      if (!isOnline || queue.length === 0) return
      
      const pendingTasks = queue.filter(t => t.status === 'pending')
      if (pendingTasks.length === 0) return

      for (const task of pendingTasks) {
        await updateTaskStatus(task.id, 'syncing')
        
        try {
          if (task.type === 'INBOUND') {
            const formData = new FormData()
            Object.entries(task.payload).forEach(([k, v]) => formData.append(k, String(v)))
            const result = await createInboundEntry(formData)
            if (!result.error) {
              await removeFromSyncQueue(task.id)
            } else {
              await updateTaskStatus(task.id, 'failed')
            }
          }
          // Other task types (ADJUST, MOVE) can be handled here
        } catch (err) {
          console.error('Sync error:', err)
          await updateTaskStatus(task.id, 'failed')
        }
      }
      
      loadQueue()
    }

    processQueue()
  }, [queue, isOnline])

  if (queue.length === 0 && isOnline) return null

  return (
    <div className={`fixed top-0 left-0 right-0 z-[100] px-4 py-1.5 text-xs font-medium text-center ${!isOnline ? 'bg-red-500 text-white' : 'bg-amber-500 text-amber-950'}`}>
      {!isOnline ? 'ออฟไลน์ (Offline Mode)' : `กำลังซิงค์ข้อมูล... (${queue.length} รายการ)`}
    </div>
  )
}
