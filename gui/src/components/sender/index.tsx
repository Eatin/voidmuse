import { Flex, Input } from 'antd';
import classnames from 'classnames';
import { useMergedState } from 'rc-util';
import pickAttrs from 'rc-util/lib/pickAttrs';
import getValue from 'rc-util/lib/utils/get';
import React from 'react';
import useProxyImperativeHandle from '@ant-design/x/lib/_util/hooks/use-proxy-imperative-handle';
import useXComponentConfig from '@ant-design/x/lib/_util/hooks/use-x-component-config';
import { useXProviderContext } from '@ant-design/x/lib/x-provider';
import SenderHeader, { SendHeaderContext } from '@ant-design/x/lib/sender/SenderHeader';
import { ActionButtonContext } from '@ant-design/x/lib/sender/components/ActionButton';
import ClearButton from '@ant-design/x/lib/sender/components/ClearButton';
import LoadingButton from '@ant-design/x/lib/sender/components/LoadingButton';
import SendButton from '@ant-design/x/lib/sender/components/SendButton';
import SpeechButton from '@ant-design/x/lib/sender/components/SpeechButton';
import useStyle from '@ant-design/x/lib/sender/style';
import useSpeech, { type AllowSpeech } from '@ant-design/x/lib/sender/useSpeech';

import type { InputRef as AntdInputRef, ButtonProps, GetProps } from 'antd';

import Document from '@tiptap/extension-document'
import Mention from '@tiptap/extension-mention'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import Placeholder from '@tiptap/extension-placeholder'
import HardBreak from '@tiptap/extension-hard-break'
import {EditorContent, useEditor} from '@tiptap/react'
import '../tiptap/styles.scss'
import Suggestion from '../tiptap/Suggestion'
import { ReactNodeViewRenderer } from '@tiptap/react'
import MentionComponent from "../tiptap/MentionComponent";
import { emitter } from '../../api/ForIDEApi';

export type SubmitType = 'enter' | 'shiftEnter' | false;

type TextareaProps = GetProps<typeof Input.TextArea>;

export interface SenderComponents {
  input?: React.ComponentType<TextareaProps>;
}
type ActionsComponents = {
  SendButton: React.ComponentType<ButtonProps>;
  ClearButton: React.ComponentType<ButtonProps>;
  LoadingButton: React.ComponentType<ButtonProps>;
  SpeechButton: React.ComponentType<ButtonProps>;
};
export type ActionsRender = (
  ori: React.ReactNode,
  info: {
    components: ActionsComponents;
  },
) => React.ReactNode;

export type FooterRender = (info: { components: ActionsComponents }) => React.ReactNode;
export interface SenderProps
  extends Pick<TextareaProps, 'placeholder' | 'onKeyPress' | 'onFocus' | 'onBlur'> {
  prefixCls?: string;
  defaultValue?: string;
  value?: string;
  loading?: boolean;
  readOnly?: boolean;
  submitType?: SubmitType;
  disabled?: boolean;
  onSubmit?: (message: string, plainText?: string) => void;
  onChange?: (
    value: string,
    event?: React.FormEvent<HTMLTextAreaElement> | React.ChangeEvent<HTMLTextAreaElement>,
  ) => void;
  onCancel?: VoidFunction;
  onKeyDown?: React.KeyboardEventHandler<any>;
  onPaste?: React.ClipboardEventHandler<HTMLElement>;
  onPasteFile?: (firstFile: File, files: FileList) => void;
  components?: SenderComponents;
  styles?: {
    prefix?: React.CSSProperties;
    input?: React.CSSProperties;
    actions?: React.CSSProperties;
    footer?: React.CSSProperties;
  };
  rootClassName?: string;
  classNames?: {
    prefix?: string;
    input?: string;
    actions?: string;
    footer?: string;
  };
  style?: React.CSSProperties;
  className?: string;
  actions?: React.ReactNode | ActionsRender;
  allowSpeech?: AllowSpeech;
  prefix?: React.ReactNode;
  footer?: React.ReactNode | FooterRender;
  header?: React.ReactNode;
  autoSize?: boolean | { minRows?: number; maxRows?: number };
}

export type SenderRef = {
  nativeElement: HTMLDivElement;
} & Pick<AntdInputRef, 'focus' | 'blur'>;

function getComponent<T>(
  components: SenderComponents | undefined,
  path: string[],
  defaultComponent: React.ComponentType<T>,
): React.ComponentType<T> {
  return getValue(components, path) || defaultComponent;
}

/** Used for actions render needed components */
const sharedRenderComponents = {
  SendButton,
  ClearButton,
  LoadingButton,
  SpeechButton,
};

const ForwardSender = React.forwardRef<SenderRef, SenderProps>((props, ref) => {
  const {
    prefixCls: customizePrefixCls,
    styles = {},
    classNames = {},
    className,
    rootClassName,
    style,
    defaultValue,
    value,
    readOnly,
    submitType = 'enter',
    onSubmit,
    loading,
    components,
    onCancel,
    onChange,
    actions,
    onKeyPress,
    onKeyDown,
    disabled,
    allowSpeech,
    prefix,
    footer,
    header,
    onPaste,
    onPasteFile,
    autoSize = { maxRows: 8 },
    ...rest
  } = props;

  // ============================= MISC =============================
  const { direction, getPrefixCls } = useXProviderContext();
  const prefixCls = getPrefixCls('sender', customizePrefixCls);

  // ============================= Refs =============================
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<AntdInputRef>(null);

  useProxyImperativeHandle(ref, () => ({
    nativeElement: containerRef.current!,
    focus: inputRef.current?.focus!,
    blur: inputRef.current?.blur!,
  }));

  // ======================= Component Config =======================
  const contextConfig = useXComponentConfig('sender');
  const inputCls = `${prefixCls}-input`;

  // ============================ Styles ============================
  const [wrapCSSVar, hashId, cssVarCls] = useStyle(prefixCls);
  const mergedCls = classnames(
    prefixCls,
    contextConfig.className,
    className,
    rootClassName,
    hashId,
    cssVarCls,
    {
      [`${prefixCls}-rtl`]: direction === 'rtl',
      [`${prefixCls}-disabled`]: disabled,
    },
  );

  const actionBtnCls = `${prefixCls}-actions-btn`;
  const actionListCls = `${prefixCls}-actions-list`;

  // ============================ Value =============================
  const [innerValue, setInnerValue] = useMergedState(defaultValue || '', {
    value,
  });

  const triggerValueChange: SenderProps['onChange'] = (nextValue, event) => {
    setInnerValue(nextValue);

    if (onChange) {
      onChange(nextValue, event);
    }
  };

  // ============================ Speech ============================
  const [speechPermission, triggerSpeech, speechRecording] = useSpeech((transcript) => {
    triggerValueChange(`${innerValue} ${transcript}`);
  }, allowSpeech);

  // ========================== Components ==========================
  const InputTextArea = getComponent(components, ['input'], Input.TextArea);

  const domProps = pickAttrs(rest, {
    attr: true,
    aria: true,
    data: true,
  });

  const inputProps: typeof domProps = {
    ...domProps,
    ref: inputRef,
  };

  // ============================ Events ============================
  // Add message history state
  const [messageHistory, setMessageHistory] = React.useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = React.useState<number>(-1);

  const triggerSend = () => {
    if (innerValue && onSubmit && !loading) {
      // Add current message to history
      if (innerValue.trim() !== '') {
        setMessageHistory(prev => [innerValue, ...prev]);
        setHistoryIndex(-1); // Reset history index
      }
      // Get plain text content
      const plainText = editor?.getText() || '';
      // Pass rich text and plain text
      onSubmit(innerValue, plainText);
    }
  };

  const triggerClear = () => {
    triggerValueChange('');
  };

  // ============================ Submit ============================
  const isCompositionRef = React.useRef(false);

  const onInternalCompositionStart = () => {
    isCompositionRef.current = true;
  };

  const onInternalCompositionEnd = () => {
    isCompositionRef.current = false;
  };

  const onInternalKeyPress: TextareaProps['onKeyPress'] = (e) => {
    const canSubmit = e.key === 'Enter' && !isCompositionRef.current;

    // Check for `submitType` to submit
    switch (submitType) {
      case 'enter':
        if (canSubmit && !e.shiftKey) {
          e.preventDefault();
          triggerSend();
        }
        break;

      case 'shiftEnter':
        if (canSubmit && e.shiftKey) {
          e.preventDefault();
          triggerSend();
        }
        break;
    }

    onKeyPress?.(e);
  };

  // ============================ Paste =============================
  const onInternalPaste: React.ClipboardEventHandler<HTMLElement> = (e) => {
    // Get files
    const files = e.clipboardData?.files;
    if (files?.length && onPasteFile) {
      onPasteFile(files[0], files);
      e.preventDefault();
    }

    onPaste?.(e);
  };

  // ============================ Focus =============================
  const onContentMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
    // Only prevent default when clicking outside the editor content
    const editorElement = containerRef.current?.querySelector('.ProseMirror');
    if (!editorElement?.contains(e.target as Node)) {
      e.preventDefault();
      editor?.commands.focus();
    }
  };

  // ============================ Action ============================
  let actionNode: React.ReactNode = (
    <Flex className={`${actionListCls}-presets`}>
      {allowSpeech && <SpeechButton />}
      {/* Loading or Send */}
      {loading ? <LoadingButton /> : <SendButton />}
    </Flex>
  );

  // Custom actions
  if (typeof actions === 'function') {
    actionNode = actions(actionNode, {
      components: sharedRenderComponents,
    });
  } else if (actions || actions === false) {
    actionNode = actions;
  }
  // Custom actions context props
  const actionsButtonContextProps = {
    prefixCls: actionBtnCls,
    onSend: triggerSend,
    onSendDisabled: !innerValue,
    onClear: triggerClear,
    onClearDisabled: !innerValue,
    onCancel,
    onCancelDisabled: !loading,
    onSpeech: () => triggerSpeech(false),
    onSpeechDisabled: !speechPermission,
    speechRecording,
    disabled,
  };

  // ============================ Footer ============================
  const footerNode =
    typeof footer === 'function' ? footer({ components: sharedRenderComponents }) : footer || null;

  // ============================ Render ============================
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      HardBreak,
      Mention.configure({
        HTMLAttributes: {
          class: 'mention',
        },
        suggestion: Suggestion,
        renderHTML: ({ options, node }) => {
          // console.log(`renderHTML node.attrs : ${JSON.stringify(node.attrs)}`)
          return [
            'span',
            {
              class: 'mention',
              'data-type': 'mention',
              'data-id': node.attrs.id,
              'data-label': node.attrs.label,
              'expansion-data-line': node.attrs.line,
              'expansion-data-type': node.attrs.type || '',
              'expansion-data-path': node.attrs.path || '',
              'expansion-data-selected': node.attrs.selected || '',
            },
            `${options.suggestion.char}${node.attrs.label ?? node.attrs.id}`
          ]
        },
      }).extend({
        addAttributes() {
          return {
            ...(this.parent?.() || {}),
            type: {},
            path: {},
            line: {},
            selected: {}
          };
        },
        addNodeView() {
          return ReactNodeViewRenderer(MentionComponent)
        }
      }),
      Placeholder.configure({
        placeholder: props.placeholder || ''
      }),
    ],
    content: innerValue || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      triggerValueChange(html);
      triggerSpeech(true);
    },
    // Add keyboard event handling
    editorProps: {
      handleKeyDown: (view, event) => {
        const eventKey = event.key;
        const suggestionPopup = document.querySelector('.tippy-box');
        if (eventKey === 'ArrowUp' && !suggestionPopup){
          // Navigate up through message history
          if (messageHistory.length > 0 ) {
            // Note: messages are sorted as [newest, ...older], so navigating up should increase index
            const newIndex = historyIndex === -1 ? 0 : historyIndex < messageHistory.length - 1 ? historyIndex + 1 : historyIndex;
            setHistoryIndex(newIndex);
            if (newIndex >= 0 && newIndex < messageHistory.length) {
              editor?.commands.setContent(messageHistory[newIndex]);
            }
          }
          return true;
        } else if (eventKey === 'ArrowDown' && !suggestionPopup){
          // Navigate down through message history
          if (messageHistory.length > 0 && historyIndex > -1) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            if (newIndex >= 0) {
              editor?.commands.setContent(messageHistory[newIndex]);
            } else {
              // Clear input if reached bottom
              editor?.commands.setContent('');
              // Reset index to ensure next up arrow starts from newest message
              setHistoryIndex(-1);
            }
          }
          return true;
        }

        const canSubmit = eventKey === 'Enter' && !isCompositionRef.current;
        switch (submitType) {
          case 'enter':
            if (canSubmit && !event.shiftKey && !suggestionPopup) {
              event.preventDefault();
              triggerSend();
              return true;
            }
            if (canSubmit && event.shiftKey) {
              event.preventDefault();
              editor?.commands.setHardBreak();
              return true;
            }
            break;

          case 'shiftEnter':
            if (canSubmit && event.shiftKey && !suggestionPopup) {
              event.preventDefault();
              triggerSend();
              return true;
            }
            break;
        }

        return false;
      }
    }
  })

  // Add event listeners
  React.useEffect(() => {
    // Listen for addToChat event
    const handleAddToChat = (data: any) => {
      console.log('Sender received addToChat event:', data);

      if (editor) {
        editor.chain()
          .insertContent({
            type: 'mention',
            attrs: {
              label: data.fileName,
              type: 'file',
              path: data.filePath,
              line: data.start + '-' + data.end,
              selected: data.selected
            }
          })
          .insertContent(' ')
          .focus()
          .run();
      }
    };

    const handleEditCode = (data: any) => {
      console.log('Sender received editCode event:', data);

      if (editor) {
        editor.chain()
          .insertContent({
            type: 'mention',
            attrs: {
              label: data.fileName,
              type: 'fileEdit',
              path: data.filePath,
              line: data.start + '-' + data.end,
              selected: data.selected,
            }
          })
          .insertContent(' ')
          .focus()
          .run();
      }
    };

    // Register event listeners
    emitter.on('addToChat', handleAddToChat);
    emitter.on('editCodeInChat', handleEditCode);

    // Cleanup function
    return () => {
      emitter.off('addToChat', handleAddToChat);
      emitter.off('editCodeInChat', handleEditCode);
    };
  }, [editor]);

  React.useEffect(() => {
    if (editor && value !== undefined && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  // Calculate editor styles, apply autoSize
  const editorStyle: React.CSSProperties = {
    ...contextConfig.styles.input,
    ...styles.input,
  };

  // Handle autoSize
  if (autoSize) {
    if (typeof autoSize === 'object') {
      editorStyle.minHeight = '48px';
      if (autoSize.maxRows) {
        editorStyle.maxHeight = `${autoSize.maxRows * 24}px`;
        editorStyle.overflowY = 'auto';
      }
    }
  }

  return wrapCSSVar(
      <div ref={containerRef} className={mergedCls} style={{...contextConfig.style, ...style}}>
        {/* Header */}
        {header && (
            <SendHeaderContext.Provider value={{prefixCls}}>{header}</SendHeaderContext.Provider>
        )}
        <ActionButtonContext.Provider value={actionsButtonContextProps}>
          <div className={`${prefixCls}-content`} onMouseDown={onContentMouseDown}>
            {/* Prefix */}
            {prefix && (
                <div
                    className={classnames(
                        `${prefixCls}-prefix`,
                        contextConfig.classNames.prefix,
                        classNames.prefix,
                    )}
                    style={{...contextConfig.styles.prefix, ...styles.prefix}}
                >
                  {prefix}
                </div>
            )}

            <EditorContent
                editor={editor}
                disabled={disabled}
                style={editorStyle}
                className={classnames(inputCls, contextConfig.classNames.input, classNames.input)}
                onKeyDown={onKeyDown}
                onPaste={onInternalPaste}
                onCompositionStart={onInternalCompositionStart}
                onCompositionEnd={onInternalCompositionEnd}
            />

            {/* Action List */}
            {actionNode && (
                <div
                    className={classnames(
                        actionListCls,
                        contextConfig.classNames.actions,
                        classNames.actions,
                    )}
                    style={{...contextConfig.styles.actions, ...styles.actions}}
                >
                  {actionNode}
                </div>
            )}
          </div>
          {footerNode && (
              <div
                  className={classnames(
                      `${prefixCls}-footer`,
                      contextConfig.classNames.footer,
                      classNames.footer,
                  )}
                  style={{
                    ...contextConfig.styles.footer,
                    ...styles.footer,
                  }}
              >
                {footerNode}
              </div>
          )}
        </ActionButtonContext.Provider>
      </div>,
  );
});

type CompoundedSender = typeof ForwardSender & {
  Header: typeof SenderHeader;
};

const Sender = ForwardSender as CompoundedSender;

if (import.meta.env.MODE !== 'production') {
  Sender.displayName = 'Sender';
}

Sender.Header = SenderHeader;

export default Sender;
