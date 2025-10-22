import React, {forwardRef, useEffect, useImperativeHandle, useRef, useState,} from 'react'
import FileIcon from '../icon/FileIcon'
import {IDEService} from "@/api/IDEService";
import {Tooltip} from 'antd';
import {ProjectInfoResponse} from "@/types/ide";

interface MentionItem {
    label: string
    value: string
    id: number
    type?: string
    isLeaf?: boolean
    hasChildren?: boolean
    children?: MentionItem[]
    description?: string
    path?: string
    disabled?: boolean,
    icon?: React.ReactNode
}

interface MentionListProps {
    onSelect: (item: MentionItem) => void
    items: MentionItem[]
    query: string
}

export interface MentionListRef {
    onKeyDown: ({event}: { event: KeyboardEvent }) => boolean
}

const fuzzyFilter = (item: MentionItem, query: string) => {
    const itemLabel = item.label.toLowerCase()
    const searchQuery = query.toLowerCase()
    let queryIndex = 0
    let labelIndex = 0
    while (queryIndex < searchQuery.length && labelIndex < itemLabel.length) {
        if (searchQuery[queryIndex] === itemLabel[labelIndex]) {
            queryIndex++
        }
        labelIndex++
    }
    return queryIndex === searchQuery.length
}

const getRelativePath = (fullPath: string, projectPath: string): string => {
    if (!projectPath || projectPath.trim() === '') {
        return fullPath;
    }
    
    // Ensure projectPath ends with path separator
    const normalizedProjectPath = projectPath.endsWith('/') ? projectPath : projectPath + '/';
    if (fullPath.startsWith(normalizedProjectPath)) {
        return fullPath.substring(normalizedProjectPath.length);
    }
    
    return fullPath;
};

const MentionList = forwardRef<MentionListRef, MentionListProps>((props, ref) => {
    const {onSelect, items, query} = props
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [isHoverSelected, setIsHoverSelected] = useState(false)
    const [menuStack, setMenuStack] = useState<MentionItem[][]>([items])
    const [enterSubItem, setEnterSubItem] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [projectPath, setProjectPath] = useState<string>('')
    const menuRef = useRef<HTMLDivElement | null>(null)
    const itemRefs = useRef<Array<HTMLButtonElement | null>>([])

    const getFilteredItems = (items: MentionItem[], query: string) => {
        if (!query) return items
        const targetItems = enterSubItem && items[0]?.children ? items[0].children! : items
        return targetItems.filter(item => fuzzyFilter(item, query))
    }

    useEffect(() => {
        setMenuStack([getFilteredItems(items, query)])
        setSelectedIndex(0)
        // eslint-disable-next-line
    }, [items, query])

    const currentMenu = menuStack[menuStack.length - 1]

    useEffect(() => {
        itemRefs.current = itemRefs.current.slice(0, currentMenu.length)
        itemRefs.current[selectedIndex]?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
        })
    }, [selectedIndex, currentMenu])

    const selectItem = async (index: number) => {
        if (!currentMenu || index < 0 || index >= currentMenu.length) return false
        const item = currentMenu[index]
        if (item.isLeaf || !item.hasChildren) {
            onSelect(item)
        } else if (item.hasChildren) {
            setIsLoading(true)
            try {
                const children = await fetchChildrenData(item)
                item.children = children
                setMenuStack([...menuStack, children])
                setEnterSubItem(true)
                setSelectedIndex(0)
            } catch (error) {
                console.error('Error loading submenu data:', error)
            } finally {
                setIsLoading(false)
            }
        }
    }

    const fetchChildrenData = async (item: MentionItem): Promise<MentionItem[]> => {
        switch (item.label) {
            case 'file':
                const ideService = IDEService.getInstance();
                const resp = await ideService.getProjectConfig();
                setProjectPath(resp.projectPath || '');

                const fileInfoList = await ideService.getFileList({fileName: ''});
                return fileInfoList.map((fileInfo, index) => {
                    return {
                        label: fileInfo.name,
                        icon: <FileIcon fileName={fileInfo.name} />,
                        value: fileInfo.name,
                        path: fileInfo.path,  // Save full path, process during rendering
                        type: item.label,
                        isLeaf: true,
                        id: index,
                    };
                });
            case 'knowledge':
                return [
                    {
                        label: 'knowledgeTest',
                        icon: <FileIcon type="file"/>,
                        value: 'knowledgeTest',
                        id: 0,
                        type: item.label,
                        isLeaf: true
                    },
                ]
            default:
                return []
        }
    }

    const backToPreviousMenu = () => {
        if (menuStack.length > 1) {
            setMenuStack(menuStack.slice(0, -1))
            setSelectedIndex(0)
            return true
        }
        return false
    }

    // Keyboard event handling
    const upHandler = () => {
        if (!currentMenu.length) return
        setIsHoverSelected(false) // Cancel hover selection state
        let newIndex = selectedIndex
        do {
            newIndex = (newIndex + currentMenu.length - 1) % currentMenu.length
        } while (currentMenu[newIndex].disabled)
        setSelectedIndex(newIndex)
    }

    const downHandler = () => {
        if (!currentMenu.length) return
        setIsHoverSelected(false) // Cancel hover selection state
        let newIndex = selectedIndex
        do {
            newIndex = (newIndex + 1) % currentMenu.length
        } while (currentMenu[newIndex].disabled)
        setSelectedIndex(newIndex)
    }

    const enterHandler = () => {
        if (!currentMenu.length) return false
        selectItem(selectedIndex)
        return true
    }

    useImperativeHandle(ref, () => ({
        onKeyDown: ({event}: { event: KeyboardEvent }) => {
            switch (event.key) {
                case 'ArrowUp':
                    upHandler()
                    return true
                case 'ArrowDown':
                    downHandler()
                    return true
                case 'Enter':
                    return enterHandler()
                case 'Backspace':
                    return backToPreviousMenu()
                default:
                    return false
            }
        },
    }))

    const renderMenuItem = (item: MentionItem, index: number) => {
        if (item.disabled) return null
        if (item.description) {
        }
        
        const displayPath = item.path ? getRelativePath(item.path, projectPath) : '';
        return (
            <Tooltip
                placement="top"
                title={displayPath}  // Use processed relative path
                open={index === selectedIndex && !!displayPath}
                overlayStyle={{
                    '--antd-arrow-background-color': 'var(--tiptap-dropdown-menu-background-color)',
                    zIndex: 9999 // Add this line to ensure Tooltip displays on top
                } as React.CSSProperties}
                overlayInnerStyle={{
                    backgroundColor: 'var(--tiptap-dropdown-menu-background-color)',
                    color: 'var(--text-color)'
                }}
            >
                <button
                    className={`${index === selectedIndex ? 'menu-item is-selected' : 'menu-item'}${item.disabled ? ' disabled' : ''}`}
                    key={`item-${index}-${item.id}`}
                    onClick={() => selectItem(index)}
                    onMouseEnter={() => {
                        setSelectedIndex(index)
                        setIsHoverSelected(true)
                    }}
                    onMouseLeave={() => {
                        if (isHoverSelected) {
                            setIsHoverSelected(false)
                        }
                    }}
                    disabled={item.disabled}
                    ref={el => {
                        itemRefs.current[index] = el
                    }}
                    style={{maxWidth: '280px', overflow: 'hidden'}}
                >
                    <span className="icon" style={{flexShrink: 0}}>{item.icon}</span>
                    <span className="label" style={{
                        width: '150px',  // Use fixed width instead of maxWidth
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flexShrink: 0  // Prevent compression in flex layout
                    }}>{item.label}</span>
                    {displayPath &&  // Use processed relative path
                        <span className="path" style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            direction: 'rtl',
                            textAlign: 'left'
                        }}>{displayPath}</span>
                    }
                </button>
    
            </Tooltip>
        )
    }

    return (
        <div className="dropdown-menu" ref={menuRef}>
            {isLoading && <div className="loading">Loading...</div>}
            {currentMenu.length
                ? currentMenu.map(renderMenuItem)
                : <div className="item">No results</div>
            }
        </div>
    )
})

export default MentionList