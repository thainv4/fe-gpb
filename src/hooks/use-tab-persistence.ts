import { useEffect, useRef, useCallback } from 'react'
import { useTabsStore } from '@/lib/stores/tabs'
import { usePathname } from 'next/navigation'

interface UseTabPersistenceOptions {
  // Tự động lưu scroll position
  saveScroll?: boolean
  
  // Debounce time cho việc lưu state (ms)
  debounceMs?: number
  
  // Callback khi restore state
  onRestore?: (data: any) => void
  
  // Callback khi save state (để debug hoặc xử lý thêm)
  onSave?: (data: any) => void
  
  // Chỉ restore một lần khi mount (mặc định: true)
  restoreOnce?: boolean
}

/**
 * Custom hook để tự động lưu và restore state của tab
 * Chỉ sử dụng cho các tab trong phần xét nghiệm
 * 
 * @example
 * ```tsx
 * const [formData, setFormData] = useState({})
 * const { scrollContainerRef } = useTabPersistence(
 *   formData,
 *   {
 *     saveScroll: true,
 *     debounceMs: 500,
 *     onRestore: (data) => setFormData(data)
 *   }
 * )
 * 
 * return <div ref={scrollContainerRef}>...</div>
 * ```
 */
export function useTabPersistence<T extends Record<string, any>>(
  state: T,
  options: UseTabPersistenceOptions = {}
) {
  const pathname = usePathname()
  const { activeKey, tabs, saveTabState, getTabState, saveScrollPosition, restoreScrollPosition } = useTabsStore()
  
  // Sử dụng activeKey hoặc pathname làm tab key
  const tabKey = activeKey ?? pathname ?? 'default'
  
  const scrollContainerRef = useRef<HTMLElement | null>(null)
  const isRestoringRef = useRef(false)
  const hasRestoredRef = useRef(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const {
    saveScroll = false,
    debounceMs = 300,
    onRestore,
    onSave,
    restoreOnce = true,
  } = options
  
  // Restore state khi mount hoặc chuyển tab
  useEffect(() => {
    // Nếu restoreOnce = true và đã restore rồi, skip
    if (restoreOnce && hasRestoredRef.current) {
      return
    }
    
    const savedState = getTabState(tabKey)
    if (savedState && !isRestoringRef.current) {
      isRestoringRef.current = true
      
      // Restore scroll position
      if (saveScroll && savedState.scrollPosition !== undefined && scrollContainerRef.current) {
        // Sử dụng requestAnimationFrame để đảm bảo DOM đã render
        requestAnimationFrame(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo(0, savedState.scrollPosition!)
          }
        })
      }
      
      // Call onRestore callback với formData
      if (onRestore && savedState.formData) {
        onRestore(savedState.formData)
      }
      
      hasRestoredRef.current = true
      isRestoringRef.current = false
    } else if (!savedState && restoreOnce) {
      // Nếu không có saved state, đánh dấu đã restore để không restore lại
      hasRestoredRef.current = true
    }
  }, [tabKey, getTabState, saveScroll, onRestore, restoreOnce])
  
  // Reset restore flag khi chuyển tab
  useEffect(() => {
    if (restoreOnce) {
      hasRestoredRef.current = false
    }
  }, [activeKey, restoreOnce])
  
  // Save state với debounce
  useEffect(() => {
    // Không save khi đang restore
    if (isRestoringRef.current) return
    
    // Clear timeout cũ nếu có
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    // Set timeout mới
    saveTimeoutRef.current = setTimeout(() => {
      const stateToSave: any = {
        formData: state,
        lastAccessed: Date.now(),
      }
      
      saveTabState(tabKey, stateToSave)
      
      // Call onSave callback nếu có
      if (onSave) {
        onSave(stateToSave)
      }
    }, debounceMs)
    
    // Cleanup
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [tabKey, state, saveTabState, debounceMs, onSave])
  
  // Save scroll position
  useEffect(() => {
    if (!saveScroll || !scrollContainerRef.current) return
    
    const container = scrollContainerRef.current
    
    // Debounce scroll handler để tránh save quá nhiều
    let scrollTimeout: NodeJS.Timeout | null = null
    const handleScroll = () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }
      
      scrollTimeout = setTimeout(() => {
        if (container) {
          saveScrollPosition(tabKey, container.scrollTop)
        }
      }, 100) // Debounce scroll save
    }
    
    container.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      container.removeEventListener('scroll', handleScroll)
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }
    }
  }, [tabKey, saveScroll, saveScrollPosition])
  
  // Helper function để manually save state
  const manualSave = useCallback((customData?: Partial<T>) => {
    const stateToSave = {
      formData: customData ? { ...state, ...customData } : state,
      lastAccessed: Date.now(),
    }
    saveTabState(tabKey, stateToSave)
    if (onSave) {
      onSave(stateToSave)
    }
  }, [tabKey, state, saveTabState, onSave])
  
  // Helper function để manually restore state
  const manualRestore = useCallback(() => {
    const savedState = getTabState(tabKey)
    if (savedState) {
      isRestoringRef.current = true
      
      if (saveScroll && savedState.scrollPosition !== undefined && scrollContainerRef.current) {
        requestAnimationFrame(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo(0, savedState.scrollPosition!)
          }
        })
      }
      
      if (onRestore && savedState.formData) {
        onRestore(savedState.formData)
      }
      
      isRestoringRef.current = false
      return savedState.formData
    }
    return null
  }, [tabKey, getTabState, saveScroll, onRestore])
  
  // Helper function để clear saved state
  const clearSavedState = useCallback(() => {
    saveTabState(tabKey, {
      formData: {},
      scrollPosition: 0,
      lastAccessed: Date.now(),
    })
  }, [tabKey, saveTabState])
  
  return {
    scrollContainerRef,
    tabKey,
    manualSave,
    manualRestore,
    clearSavedState,
    getSavedState: () => getTabState(tabKey),
  }
}

