import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react'

interface EditModeContextType {
  isEditMode: boolean
  setIsEditMode: (enabled: boolean) => void
}

const EditModeContext = createContext<EditModeContextType | undefined>(
  undefined,
)

export const useEditMode = () => {
  const context = useContext(EditModeContext)
  if (context === undefined) {
    throw new Error('useEditMode must be used within an EditModeProvider')
  }
  return context
}

interface EditModeProviderProps {
  children: ReactNode
}

export const EditModeProvider: React.FC<EditModeProviderProps> = ({
  children,
}) => {
  const [isEditMode, setIsEditMode] = useState(false)

  return (
    <EditModeContext.Provider value={{ isEditMode, setIsEditMode }}>
      {children}
    </EditModeContext.Provider>
  )
}
