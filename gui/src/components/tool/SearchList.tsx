import React from 'react';
import { useTranslation } from 'react-i18next';
import { List, Card, Popover, Typography, Space } from 'antd';
import { GlobalOutlined, SearchOutlined, LoadingOutlined } from '@ant-design/icons';
import IconWithVerticalLine from '../display/IconWithVerticalLine';
import FileIcon from '../icon/FileIcon';
import './SearchList.scss';
import { SearchResultItem } from '@/types/search';
import { IDEService } from '@/api/IDEService';
import CollapsePanel from '@/components/display/CollapsePanel';
import type { MessageStatus } from '@ant-design/x/es/use-x-chat';
import { BulbOutlined } from '@ant-design/icons';
import Markdown from '@/components/display/Markdown';

const { Text, Title, Paragraph } = Typography;

export interface SearchListProps {
    results: SearchResultItem[];
    status: MessageStatus;
    searchIntent: string;
    keyword: string;
    errorMessage?: string;
}

const getDomainFromUrl = (url: string): string => {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname;
    } catch (error) {
        return url;
    }
};

const SearchList: React.FC<SearchListProps> = ({
    results,
    status,
    searchIntent, 
    keyword,
    errorMessage
}) => {
    const { t } = useTranslation('components');
    const renderListItem = (item: SearchResultItem) => {
        const domain = getDomainFromUrl(item.url);

        const popoverContent = (
            <Card className="search-result-card" style={{ border: 'none' }}>
                <div className="search-result-url">
                    <Space>
                        {item.favicon ?
                            <img src={item.favicon} alt={t('tool.searchList.websiteIcon') as string} className="search-result-favicon" /> :
                            <GlobalOutlined className="search-result-icon" />
                        }
                        <Text type="secondary">{domain}</Text>
                    </Space>
                </div>
                <Title level={5} className="search-result-title">{item.title}</Title>
                <Paragraph className="search-result-description">{item.description}</Paragraph>
            </Card>
        );

        return (
            <Popover
                content={popoverContent}
                trigger="hover"
                placement="left"
                className="search-result-popover"
                autoAdjustOverflow={false}
                // Disable popover due to difficulties in adapting width detection for open/close state, temporarily disable this feature
                open={false}
            >
                <List.Item
                    className="search-list-item"
                    onClick={() => {
                        IDEService.getInstance().openUrl({ url: item.url });
                    }}
                >
                    <div className="search-list-index">{item.index}</div>
                    <div className="search-list-content">
                        {item.favicon ?
                            <img src={item.favicon} alt={t('tool.searchList.websiteIcon') as string} className="search-list-favicon" /> :
                            <FileIcon type="web" className="search-list-icon" />
                        }
                        <div className="search-list-title">{item.title}</div>
                    </div>
                </List.Item>
            </Popover>
        );
    };

    return (
        <CollapsePanel 
            title={`${t('tool.searchList.search')}: ${keyword}`} 
            defaultOpen={status === 'loading'}
            icon={status === 'loading' ? <LoadingOutlined spin /> : <SearchOutlined />}
        >
            <div className={`search-list-container`}>
                <IconWithVerticalLine
                    icon={<BulbOutlined />}
                    tooltipTitle={t('tool.searchList.searchIntent')}
                    >
                    <div className="search-intent-content">
                        <Markdown content={searchIntent} />

                    </div>
                </IconWithVerticalLine>
                {errorMessage ? (
                    <IconWithVerticalLine
                        icon={<GlobalOutlined />}
                        tooltipTitle='search fail'
                    >
                        <div className="search-error-message">
                            <Text type="danger">{errorMessage}</Text>
                        </div>
                    </IconWithVerticalLine>
                ) : results.length > 0 && (
                    <IconWithVerticalLine
                        icon={<GlobalOutlined />}
                        tooltipTitle={t('tool.searchList.searchResults')}
                    >
                        <List
                            className="search-results-list"
                            dataSource={results}
                            renderItem={renderListItem}
                        />
                    </IconWithVerticalLine>
                )}
            </div>
        </CollapsePanel>
    );
};

export default SearchList;