'use client';
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CurrentRoomState {
  currentRoomId?: string
  currentDepartmentId?: string
  currentRoomName?: string
  currentRoomCode?: string
  currentDepartmentCode?: string
  currentDepartmentName?: string
  setRoom: (args: {
    roomId: string
    departmentId: string
    roomName?: string
    roomCode?: string
    departmentCode?: string
    departmentName?: string
  }) => void
  clear: () => void
}

export const useCurrentRoomStore = create<CurrentRoomState>()(
  persist(
    (set) => ({
      currentRoomId: undefined,
      currentDepartmentId: undefined,
      currentRoomName: undefined,
      currentRoomCode: undefined,
      currentDepartmentCode: undefined,
      currentDepartmentName: undefined,
      setRoom: ({ roomId, departmentId, roomName, roomCode, departmentCode, departmentName }) =>
        set({
          currentRoomId: roomId,
          currentDepartmentId: departmentId,
          currentRoomName: roomName,
          currentRoomCode: roomCode,
          currentDepartmentCode: departmentCode,
          currentDepartmentName: departmentName,
        }),
      clear: () => set({
        currentRoomId: undefined,
        currentDepartmentId: undefined,
        currentRoomName: undefined,
        currentRoomCode: undefined,
        currentDepartmentCode: undefined,
        currentDepartmentName: undefined,
      }),
    }),
    { name: 'current-room' }
  )
)
