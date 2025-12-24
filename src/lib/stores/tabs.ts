import { create } from 'zustand'

export type TabItem = {
  key: string
  path: string
  label: string
  closable?: boolean
  data?: any // Store any data associated with this tab
  roomId?: string // Associated room ID
  roomCode?: string // Associated room code
  roomName?: string // Associated room name
  departmentId?: string // Associated department ID
  departmentCode?: string // Associated department code
  departmentName?: string // Associated department name
}

export interface TabStateData {
  // Form states
  formData?: Record<string, any>
  
  // UI states
  scrollPosition?: number
  selectedItems?: string[]
  expandedSections?: string[]
  activeSubTab?: string
  
  // Query cache keys (để restore React Query cache)
  queryCacheKeys?: string[]
  
  // Timestamp để cleanup
  lastAccessed?: number
}

interface TabsState {
  tabs: TabItem[]
  activeKey: string | null
  tabData: Record<string, any> // Store data for each tab by key (legacy, kept for backward compatibility)
  tabState: Record<string, TabStateData> // Enhanced state storage
  tabCounter: number // Counter to generate unique tab keys
  openTab: (tab: Omit<TabItem, 'key'> & { key?: string }) => string // Returns the tab key
  closeTab: (key: string) => void
  setActive: (key: string) => void
  setTabData: (key: string, data: any) => void
  getTabData: (key: string) => any
  updateTabRoom: (key: string, roomId: string, roomCode: string, departmentCode: string) => void
  reset: () => void
  // Enhanced state methods
  saveTabState: (key: string, state: Partial<TabStateData>) => void
  getTabState: (key: string) => TabStateData | undefined
  saveScrollPosition: (key: string, position: number) => void
  restoreScrollPosition: (key: string) => number | undefined
  cleanupOldTabs: () => void
}

export const useTabsStore = create<TabsState>()((set, get) => ({
  tabs: [],
  activeKey: null,
  tabData: {},
  tabState: {},
  tabCounter: 0,
  openTab: (tab) => {
    const state = get()

    // If tab has a key and it exists, just activate it
    if (tab.key) {
      const exists = state.tabs.find((t) => t.key === tab.key)
      if (exists) {
        set({ activeKey: tab.key })
        return tab.key
      }
    }

    // For pages without room association, check if tab with same path exists
    if (!tab.roomId) {
      const existingTab = state.tabs.find((t) => t.path === tab.path)
      if (existingTab) {
        set({ activeKey: existingTab.key })
        return existingTab.key
      }
    }

    // For room-specific pages (test-indications, test-results, sample-cabinets)
    // Check if tab with same path AND room already exists
    if (tab.roomId) {
      const existingTabWithRoom = state.tabs.find(
        (t) => t.path === tab.path &&
               t.roomId === tab.roomId &&
               t.roomCode === tab.roomCode
      )
      if (existingTabWithRoom) {
        set({ activeKey: existingTabWithRoom.key })
        return existingTabWithRoom.key
      }
    }

    // Generate a unique key for new tab
    const newCounter = state.tabCounter + 1
    const tabKey = tab.key || `${tab.path}-${newCounter}`

    // Build display label with room info (only if room info is provided)
    let displayLabel = tab.label
    if (tab.roomCode && tab.departmentCode) {
      displayLabel = `${tab.label} - ${tab.roomCode} - ${tab.departmentCode}`
    } else if (tab.roomCode) {
      displayLabel = `${tab.label} - ${tab.roomCode}`
    }

    const newTab: TabItem = {
      ...tab,
      key: tabKey,
      label: displayLabel,
    }

    set((state) => ({
      tabs: [...state.tabs, newTab],
      activeKey: tabKey,
      tabCounter: newCounter,
    }))

    return tabKey
  },
  closeTab: (key: string) => {
    set((state) => {
      const newTabData = { ...state.tabData }
      const newTabState = { ...state.tabState }
      delete newTabData[key]
      delete newTabState[key]
      return {
        tabs: state.tabs.filter((t) => t.key !== key),
        activeKey: state.activeKey === key ? null : state.activeKey,
        tabData: newTabData,
        tabState: newTabState,
      }
    })
  },
  setActive: (key: string) => set({ activeKey: key }),
  setTabData: (key: string, data: any) => {
    set((state) => ({
      tabData: { ...state.tabData, [key]: data },
    }))
  },
  getTabData: (key: string) => {
    return get().tabData[key]
  },
  updateTabRoom: (key: string, roomId: string, roomCode: string, departmentCode: string) => {
    set((state) => {
      const tabs = state.tabs.map((t) => {
        if (t.key === key) {
          const baseLabel = t.label.split(' - ')[0] // Get original label without room info
          const displayLabel = `${baseLabel} - ${roomCode} - ${departmentCode}`
          return {
            ...t,
            roomId,
            roomCode,
            departmentCode,
            label: displayLabel,
          }
        }
        return t
      })
      return { tabs }
    })
  },
  reset: () => set({ tabs: [], activeKey: null, tabData: {}, tabState: {}, tabCounter: 0 }),
  
  // Enhanced state methods
  saveTabState: (key: string, state: Partial<TabStateData>) => {
    set((current) => ({
      tabState: {
        ...current.tabState,
        [key]: {
          ...current.tabState[key],
          ...state,
          lastAccessed: Date.now(),
        },
      },
    }))
  },
  
  getTabState: (key: string) => {
    return get().tabState[key]
  },
  
  saveScrollPosition: (key: string, position: number) => {
    get().saveTabState(key, { scrollPosition: position })
  },
  
  restoreScrollPosition: (key: string) => {
    return get().tabState[key]?.scrollPosition
  },
  
  cleanupOldTabs: () => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000
    set((state) => {
      const newTabState = { ...state.tabState }
      Object.keys(newTabState).forEach((key) => {
        if (newTabState[key].lastAccessed && newTabState[key].lastAccessed! < oneHourAgo) {
          delete newTabState[key]
        }
      })
      return { tabState: newTabState }
    })
  },
}))

