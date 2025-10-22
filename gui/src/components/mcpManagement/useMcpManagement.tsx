import React, {useState} from 'react';
import {Form} from 'antd';
import {McpItem} from '../../types/mcps';
import {useMcpContext} from '../../contexts/McpContext';


const useMcpManagement = () => {
    const {mcps, toggleMcpEnabled, addMcp, updateMcp, deleteMcp} = useMcpContext();

    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const [currentProvider, setCurrentProvider] = useState<string>('');
    const [form] = Form.useForm();
    const [showMcpIdInput, setShowMcpIdInput] = useState(false);
    const [isMcpSelectOpen, setIsMcpSelectOpen] = useState(false);
    const [currentEditMcp, setCurrentEditMcp] = useState<McpItem | null>(null);
    const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState<boolean>(false);
    const [mcpToDelete, setMcpToDelete] = useState<McpItem | null>(null);

    const handleSwitchChange = async (checked: boolean, key: string): Promise<void> => {
        await toggleMcpEnabled(key, checked);
    };

    const handleDeleteMcp = (record: McpItem): void => {
        setMcpToDelete(record);
        setIsDeleteModalVisible(true);
    };

    const handleCancelDelete = (): void => {
        setIsDeleteModalVisible(false);
        setMcpToDelete(null);
    };

    const handleConfirmDelete = async (record: McpItem): Promise<void> => {
        await deleteMcp(record.key);
        setIsDeleteModalVisible(false);
        setMcpToDelete(null);
    };

    const getTableData = (): McpItem[] => {
        return mcps;
    };

    const showAddMcpModal = (): void => {
        setIsModalVisible(true);
    };

    const handleCancel = (): void => {
        setIsModalVisible(false);
        form.resetFields();
        setCurrentProvider('');
        setShowMcpIdInput(false);
        setIsMcpSelectOpen(false);
        setCurrentEditMcp(null);
    };

    const handleAddMcp = async (): Promise<void> => {
        form.validateFields()
            .then(async values => {
                const config = JSON.parse(values.config);
                const name = Object.keys(config.mcpServers)[0]; 
                var url = ""
                var command = ""
                let args:string[] = []
                let headers:Record<string,string> = {}
                if (config.mcpServers && config.mcpServers[name]) {
                    console.log("Server Name:", name);
                    if(config.mcpServers[name].url){
                        url = config.mcpServers[name].url
                        console.log("Server URL:", url);
                        if(config.mcpServers[name].headers){
                            headers = config.mcpServers[name].headers
                        }
                    }else if(config.mcpServers[name].command){
                        command = config.mcpServers[name].command
                        args = config.mcpServers[name].args
                    }               
                }
                var mcpId = name;
                if (currentEditMcp) {
                    const updatedMcp = {
                        ...currentEditMcp,
                        name: name,
                        url: url,
                        command: command,
                        args: args,
                        headers: headers,
                        config: values.config,
                        connected:false,
                        enabled: true,
                        mcpId: mcpId,
                        
                    };
                    console.log(`Updated MCP object: ${JSON.stringify(updatedMcp)}`)
                    await updateMcp(updatedMcp);
                } else {
                    const newMcp = {
                        key: Date.now().toString(),
                        name: name,
                        url: url,
                        command: command,
                        args: args,
                        headers: headers,
                        config: values.config,
                        connected:false,
                        enabled: true,
                        tools: []
                    };

                    console.log(`Added MCP object: ${JSON.stringify(newMcp)}`)
                    await addMcp(newMcp);

                }

                setIsModalVisible(false);
                form.resetFields();
                setShowMcpIdInput(false);
                setIsMcpSelectOpen(false);
                setCurrentEditMcp(null);
            })
            .catch(info => {
                console.log('Form validation failed:', info);
            });
    };

    const handleProviderChange = (value: string) => {
        setCurrentProvider(value);
        form.setFieldsValue({mcp: undefined});
    };

    const editMcp = (record: McpItem): void => {
        setCurrentEditMcp(record);
        form.setFieldsValue({
            config: record.config
        });
        setIsModalVisible(true);
    };

    const toggleGroup = (groupKey: string) => {
        setExpandedGroups(prev => {
            const newGroups = prev.includes(groupKey)
                ? prev.filter(key => key !== groupKey)  
                : [...prev, groupKey];                 
            
            return newGroups;
        });
    };

    return {
        mcpData: mcps, 
        expandedGroups,
        isModalVisible,
        currentProvider,
        form,
        showMcpIdInput,
        setShowMcpIdInput,
        isMcpSelectOpen,
        setIsMcpSelectOpen,
        currentEditMcp,
        setCurrentEditMcp,
        handleSwitchChange,
        toggleGroup,
        handleDeleteMcp,
        getTableData,
        showAddMcpModal,
        handleCancel,
        handleAddMcp,
        handleProviderChange,
        setCurrentProvider,
        setIsModalVisible,
        isDeleteModalVisible,
        mcpToDelete,
        handleCancelDelete,
        handleConfirmDelete,
        editMcp
    };
};

export default useMcpManagement;