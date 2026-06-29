import { get, set, update } from 'idb-keyval'

export interface SyncTask {
  id: string
  type: 'INBOUND' | 'ADJUST' | 'MOVE'
  payload: any
  status: 'pending' | 'syncing' | 'failed'
  createdAt: number
}

const STORE_KEY = 'wms_sync_queue'

export const getSyncQueue = async (): Promise<SyncTask[]> => {
  const queue = await get<SyncTask[]>(STORE_KEY)
  return queue || []
}

export const addToSyncQueue = async (task: Omit<SyncTask, 'id' | 'status' | 'createdAt'>) => {
  const newTask: SyncTask = {
    ...task,
    id: crypto.randomUUID(),
    status: 'pending',
    createdAt: Date.now(),
  }
  
  await update(STORE_KEY, (val) => {
    const queue = val as SyncTask[] || []
    return [...queue, newTask]
  })
  
  return newTask
}

export const removeFromSyncQueue = async (taskId: string) => {
  await update(STORE_KEY, (val) => {
    const queue = val as SyncTask[] || []
    return queue.filter(t => t.id !== taskId)
  })
}

export const updateTaskStatus = async (taskId: string, status: SyncTask['status']) => {
  await update(STORE_KEY, (val) => {
    const queue = val as SyncTask[] || []
    return queue.map(t => t.id === taskId ? { ...t, status } : t)
  })
}
