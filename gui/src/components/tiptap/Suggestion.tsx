import { ReactRenderer } from '@tiptap/react'
import tippy from 'tippy.js'
import MentionList from './MentionList'
import { Editor } from '@tiptap/core'
import FileIcon from '../icon/FileIcon'
import { IDEService } from '@/api/IDEService'

interface OptionItem {
  value: string
  label: string
  isLeaf: boolean
  disabled: boolean
  children: OptionItem[]
  hasChildren: boolean
  id: string
  path?: string
  type?: string
  description?: string,
  icon?: React.ReactNode
}

interface CommandProps {
  id: string
  label: string
  path?: string
  type?: string
}

interface ComponentProps {
  items: OptionItem[]
  command: (props: CommandProps) => void
  editor: Editor
  clientRect?: () => DOMRect
  query?: string
}

let isCodebaseReady = false

let cachedOptionLists: OptionItem[] | null = null
let lastCodebaseStatus = false

const baseOptions: OptionItem[] = [
  {
    value: 'file',
    label: 'file',
    icon: <FileIcon type="file" />,
    isLeaf: false,
    disabled: false,
    children: [],
    hasChildren: true,
    id: 'file',
  },
  {
    value: 'knowledge',
    label: 'knowledge',
    isLeaf: false,
    icon: <FileIcon type="file" />,
    disabled: false,
    children: [],
    hasChildren: true,
    id: 'knowledge',
  }
]

const codebaseOption: OptionItem = {
  value: 'codebase',
  label: 'codebase',
  type: 'codebase',
  isLeaf: false,
  icon: <FileIcon type="file" />,
  disabled: false,
  children: [],
  hasChildren: false,
  id: 'codebase',
}

// Check codebase status (only called when needed)
const checkCodebaseStatus = async () => {
  try {
    const ideService = IDEService.getInstance()
    const progressStr = await ideService.getCodebaseIndexingProgress()
    const progress = parseFloat(progressStr)
    isCodebaseReady = progress === 1.0
  } catch (error) {
    isCodebaseReady = false
  }
}

const getOptionLists = (): OptionItem[] => {
  // Return cached result if status unchanged and cache exists
  if (cachedOptionLists && lastCodebaseStatus === isCodebaseReady) {
    return cachedOptionLists
  }

  // Status changed, regenerate and cache
  if (isCodebaseReady) {
    cachedOptionLists = [...baseOptions, codebaseOption]
  } else {
    cachedOptionLists = [...baseOptions]
  }

  lastCodebaseStatus = isCodebaseReady
  return cachedOptionLists
}

const handleSelect = (item: OptionItem, props: ComponentProps, component: any): void => {
  if (item.children?.length) {
    component.updateProps({
      items: item.children,
      onSelect: (subItem: OptionItem) => props.command({
        id: subItem.id,
        label: subItem.label,
        path: subItem.path,
        type: subItem.type,
      }),
    })
  } else {
    props.command({
      id: item.id,
      label: item.label,
      path: item.path,
      type: item.type,
    })
  }
}

const Suggestion = {
  items: async (): Promise<OptionItem[]> => await getOptionLists(),

  render: () => {
    let component: any
    let popup: any

    return {
      onStart: async (props: any) => {
        // Asynchronously check codebase status
        await checkCodebaseStatus()
        
        component = new ReactRenderer(MentionList, {
          props: {
            ...props,
            items: getOptionLists(),
            query: props.query,
            onSelect: (item: OptionItem) => handleSelect(item, props as ComponentProps, component),
          },
          editor: props.editor,
        })

        if (!props.clientRect) return

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'top-start',
          maxWidth: '450px'
        })
      },

      onUpdate(props: any) {
        component.updateProps({
          ...props,
          items: getOptionLists(),
          query: props.query,
          onSelect: (item: OptionItem) => handleSelect(item, props as ComponentProps, component),
        })

        if (!props.clientRect) return

        popup[0].setProps({
          getReferenceClientRect: props.clientRect,
        })
      },

      onKeyDown(props: { event: KeyboardEvent }) {
        return component.ref?.onKeyDown(props)
      },

      onExit() {
        popup?.[0]?.destroy()
        component.destroy()
      },
    }
  },
};

export default Suggestion