import { tool } from 'ai';
import { z } from 'zod';
import { IDEService } from '@/api/IDEService'
import { CallMcpParams } from '@/types/ide';

interface ToolDefinition {
    name: string;
    description?: string;
    inputSchema: {
        type: string;
        properties: Record<string, { type: string }>;
        required?: string[];
        additionalProperties?: boolean;
        $schema?: string;
    };
}

async function realCallMcpTool(params: CallMcpParams): Promise<string> {
  try {
    const ideService = IDEService.getInstance()  
    return await ideService.callMcpTool(params);
  } catch (error) {
    console.error('Remote call failed:', error);
    return JSON.stringify({
      error: 'Remote call failed',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

export function convertJsonToTool(json: Record<string, ToolDefinition>,
    callToolImpl: (params: CallMcpParams) => Promise<string> = realCallMcpTool):Record<string, any> {
    const allTools: Record<string, any> = {};
    Object.entries(json).map(([toolKey, toolDef]) => {
        const [first, ...rest] = toolKey.split('_');
        const [serviceName, toolName] = [first, rest.join('_')];

        console.log(toolDef)
        console.log(toolDef.inputSchema)
        const parameters = convertJsonSchemaToZod(toolDef.inputSchema);
        
        const t =  tool({
            description: toolDef.description || `Generated tool for ${toolName}`,
            inputSchema: parameters,
            execute: createExecuteFunctionWithImpl(serviceName, toolName, callToolImpl),
        });
        allTools[toolKey] = t;
    });
    return allTools;

}

function convertJsonSchemaToZod(schema: ToolDefinition['inputSchema']) {
    const shape: Record<string, z.ZodTypeAny> = {};
    
    for (const [propName, propDef] of Object.entries(schema.properties)) {
        let zodType: z.ZodTypeAny;
        
        switch (propDef.type) {
            case 'string':
                zodType = z.string();
                break;
            case 'number':
                zodType = z.number();
                break;
            case 'boolean':
                zodType = z.boolean();
                break;
            case 'integer':
                zodType = z.number().int();
                break;
            default:
                zodType = z.any();
                console.warn(`Unsupported type: ${propDef.type} for property ${propName}`);
        }
        
        zodType = zodType.describe(`${propName} parameter`);
        
        if (schema.required?.includes(propName)) {
            shape[propName] = zodType;
        } else {
            shape[propName] = zodType.optional();
        }
    }
    
    return z.object(shape);
}

function createExecuteFunctionWithImpl(
  serviceName: string,
  toolName: string,
  callToolImpl: (params: CallMcpParams) => Promise<string>
) {
  return async (args: Record<string, any>) => {
    try {
      const params: Record<string, any> = {};
      
      for (const key in args) {
        if (Object.prototype.hasOwnProperty.call(args, key)) {
          params[key] = args[key];
        }
      }

      const callParams: CallMcpParams = {
        serviceName,
        toolName,
        params: params
      };

      const result = await callToolImpl(callParams);
      
      try {
        return JSON.parse(result);
      } catch {
        return { result };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        service: serviceName,
        tool: toolName
      };
    }
  };
}
