import React, {useState} from 'react';
import {NodeViewWrapper, NodeViewProps} from '@tiptap/react';
import FileIcon from '../icon/FileIcon';
import {CloseOutlined} from '@ant-design/icons';
import {IDEService} from '@/api/IDEService';

const MentionComponent = ({node, getPos, editor, ...props}: NodeViewProps) => {
    const [isHovered, setIsHovered] = useState(false);

    const readonly = node.attrs.readonly === true; // Default to false

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent event bubbling
        if (typeof getPos === 'function') {
            const pos = getPos();
            // Delete current node
            editor?.commands.deleteRange({from: pos, to: pos + node.nodeSize});
        }
    };

    const handleLabelClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent event bubbling

        // Jump to file if path attribute exists
        if (node.attrs.path) {
            IDEService.getInstance().jumpToFile({path: node.attrs.path});
        }
    };

    return (
        <NodeViewWrapper
            as="span"
            className={`mention ${readonly ? 'mention-readonly' : ''}`}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                maxWidth: '100%',
                overflow: 'hidden',
                marginBottom: 5
            }}
        >
      <span
          onClick={!readonly ? handleDelete : undefined}
          style={{cursor: !readonly ? 'pointer' : 'default', flexShrink: 0, display: 'flex', alignItems: 'center'}}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
      >
        {(isHovered && !readonly) ? (
            <CloseOutlined style={{fontSize: '13px', marginRight: '4px'}}/>
        ) : (
            <FileIcon fileName={node.attrs.label}/>
        )}
      </span>
            <span
                style={{
                    maxWidth: '100px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'inline-block',
                    cursor: 'pointer'
                }}
                onClick={handleLabelClick}
            >
        {node.attrs.label || node.attrs.id}
      </span>
            {node.attrs.line && (
                <span
                    style={{
                        maxWidth: '100px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'inline-block',
                        cursor: 'pointer',
                        marginLeft: '8px'
                    }}
                >
      {node.attrs.line}
    </span>
            )}
        </NodeViewWrapper>
    );
};

export default MentionComponent;