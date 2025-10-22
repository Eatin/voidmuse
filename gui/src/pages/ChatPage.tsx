import { Layout } from 'antd';
import BubbleDisplay from '@/components/display/BubbleDisplay';
import Input from '@/components/input/Input';
import './ChatPage.scss';
import { useChatContext } from '@/contexts/ChatContext';
const { Header, Content, Footer } = Layout;

const ChatPage = () => {
    const { messages, loading, sendMessage, cancelRequest } = useChatContext();

    return (
        <>
            <Content className="chat-content">
                <BubbleDisplay messageInfos={messages} />
            </Content>
            <Footer className="chat-footer">
                <Input onRequest={sendMessage} loading={loading} onCancel={cancelRequest} />
            </Footer>
        </>
    );
};

export default ChatPage;