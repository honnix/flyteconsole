import { render, waitFor } from '@testing-library/react';
import { mockAPIContextValue } from 'components/data/__mocks__/apiContext';
import { APIContext, APIContextValue } from 'components/data/apiContext';
import { mockSimpleVariables } from 'components/Launch/LaunchForm/__mocks__/mockInputs';
import { primitiveLiteral } from 'components/Launch/LaunchForm/__mocks__/utils';
import { LaunchForm } from 'components/Launch/LaunchForm/LaunchForm';
import {
    LaunchFormProps,
    LiteralValueMap
} from 'components/Launch/LaunchForm/types';
import {
    createInputCacheKey,
    getInputDefintionForLiteralType
} from 'components/Launch/LaunchForm/utils';
import {
    Execution,
    ExecutionData,
    getExecutionData,
    getRemoteLiteralMap,
    getTask,
    getWorkflow,
    LiteralMap,
    ResourceType,
    Task,
    Variable,
    Workflow
} from 'models';
import { createMockExecution } from 'models/__mocks__/executionsData';
import { createMockTask } from 'models/__mocks__/taskData';
import {
    createMockWorkflow,
    createMockWorkflowClosure
} from 'models/__mocks__/workflowData';
import * as React from 'react';
import { long } from 'test/utils';
import { RelaunchExecutionForm } from '../RelaunchExecutionForm';

const mockContentString = 'launchFormRendered';
const simpleStringValue = 'abcdefg';
const simpleIntegerValue = long(123456);

jest.mock('components/Launch/LaunchForm/LaunchForm', () => ({
    LaunchForm: jest.fn(() => mockContentString)
}));

function createValuesMap(
    inputDefinitions: Record<string, Variable>,
    { literals }: LiteralMap
): LiteralValueMap {
    return Object.entries(inputDefinitions).reduce((out, [name, input]) => {
        out.set(
            createInputCacheKey(
                name,
                getInputDefintionForLiteralType(input.type)
            ),
            literals[name]
        );
        return out;
    }, new Map());
}

describe('RelaunchExecutionForm', () => {
    let apiContext: APIContextValue;
    let execution: Execution;
    let executionData: ExecutionData;
    let executionInputs: LiteralMap;
    let workflow: Workflow;
    let task: Task;
    let taskInputDefinitions: Record<string, Variable>;
    let workflowInputDefinitions: Record<string, Variable>;
    let onClose: jest.Mock;
    let mockGetWorkflow: jest.Mock<ReturnType<typeof getWorkflow>>;
    let mockGetTask: jest.Mock<ReturnType<typeof getTask>>;
    let mockGetExecutionData: jest.Mock<ReturnType<typeof getExecutionData>>;
    let mockGetRemoteLiteralMap: jest.Mock<ReturnType<
        typeof getRemoteLiteralMap
    >>;

    beforeEach(() => {
        onClose = jest.fn();
        execution = createMockExecution();
        workflow = createMockWorkflow('MyWorkflow');
        workflow.closure = createMockWorkflowClosure();
        task = createMockTask('MyTask');
        executionData = {
            inputs: { url: 'http://somePath', bytes: long(1000) },
            outputs: {}
        };

        mockGetWorkflow = jest.fn().mockResolvedValue(workflow);
        mockGetTask = jest.fn().mockResolvedValue(task);
        mockGetExecutionData = jest.fn().mockResolvedValue(executionData);
        mockGetRemoteLiteralMap = jest.fn().mockResolvedValue({});
        apiContext = mockAPIContextValue({
            getExecutionData: mockGetExecutionData,
            getRemoteLiteralMap: mockGetRemoteLiteralMap,
            getTask: mockGetTask,
            getWorkflow: mockGetWorkflow
        });
    });

    const renderForm = () =>
        render(
            <APIContext.Provider value={apiContext}>
                <RelaunchExecutionForm
                    execution={execution}
                    onClose={onClose}
                />
            </APIContext.Provider>
        );

    const checkLaunchFormProps = (props: Partial<LaunchFormProps>) => {
        expect(LaunchForm).toHaveBeenCalledWith(
            expect.objectContaining(props),
            expect.anything()
        );
    };

    it('passes original execution as a referenceExecution', async () => {
        const { getByText } = renderForm();
        await waitFor(() => getByText(mockContentString));
        checkLaunchFormProps({
            referenceExecutionId: execution.id
        });
    });

    describe('with workflow execution', () => {
        let values: LiteralValueMap;
        beforeEach(() => {
            workflowInputDefinitions = {
                workflowSimpleString: mockSimpleVariables.simpleString,
                workflowSimpleInteger: mockSimpleVariables.simpleInteger
            };

            workflow.closure!.compiledWorkflow!.primary.template.interface!.inputs = {
                variables: workflowInputDefinitions
            };

            executionInputs = {
                literals: {
                    workflowSimpleString: primitiveLiteral({
                        stringValue: simpleStringValue
                    }),
                    workflowSimpleInteger: primitiveLiteral({
                        integer: simpleIntegerValue
                    })
                }
            };
            execution.closure.computedInputs = executionInputs;
            mockGetRemoteLiteralMap.mockResolvedValue(executionInputs);

            values = createValuesMap(workflowInputDefinitions, executionInputs);
        });

        it('passes workflowId to LaunchForm', async () => {
            const { getByText } = renderForm();
            await waitFor(() => getByText(mockContentString));
            checkLaunchFormProps({
                workflowId: execution.closure.workflowId
            });
        });

        it('maps execution input values to workflow inputs', async () => {
            const { getByText } = renderForm();
            await waitFor(() => getByText(mockContentString));

            checkLaunchFormProps({
                initialParameters: expect.objectContaining({
                    values
                })
            });
        });

        it('correctly fetches remote execution inputs', async () => {
            delete execution.closure.computedInputs;
            const { getByText } = renderForm();
            await waitFor(() => getByText(mockContentString));
            expect(mockGetExecutionData).toHaveBeenCalledWith(execution.id);
            expect(mockGetRemoteLiteralMap).toHaveBeenCalledWith(
                executionData.inputs.url
            );
            checkLaunchFormProps({
                initialParameters: expect.objectContaining({
                    values
                })
            });
        });
    });

    describe('with single task execution', () => {
        let values: LiteralValueMap;
        beforeEach(() => {
            execution.spec.launchPlan.resourceType = ResourceType.TASK;
            taskInputDefinitions = {
                taskSimpleString: mockSimpleVariables.simpleString,
                taskSimpleInteger: mockSimpleVariables.simpleInteger
            };
            task.closure.compiledTask.template.interface!.inputs = {
                variables: taskInputDefinitions
            };

            executionInputs = {
                literals: {
                    taskSimpleString: primitiveLiteral({
                        stringValue: simpleStringValue
                    }),
                    taskSimpleInteger: primitiveLiteral({
                        integer: simpleIntegerValue
                    })
                }
            };
            execution.closure.computedInputs = executionInputs;
            mockGetRemoteLiteralMap.mockResolvedValue(executionInputs);
            values = createValuesMap(taskInputDefinitions, executionInputs);
        });

        it('passes taskId to LaunchForm', async () => {
            const { getByText } = renderForm();
            await waitFor(() => getByText(mockContentString));
            checkLaunchFormProps({
                taskId: execution.spec.launchPlan
            });
        });

        it('maps execution input values to workflow inputs', async () => {
            const { getByText } = renderForm();
            await waitFor(() => getByText(mockContentString));

            checkLaunchFormProps({
                initialParameters: expect.objectContaining({
                    values
                })
            });
        });

        it('correctly fetches remote execution inputs', async () => {
            delete execution.closure.computedInputs;
            const { getByText } = renderForm();
            await waitFor(() => getByText(mockContentString));
            expect(mockGetExecutionData).toHaveBeenCalledWith(execution.id);
            expect(mockGetRemoteLiteralMap).toHaveBeenCalledWith(
                executionData.inputs.url
            );
            checkLaunchFormProps({
                initialParameters: expect.objectContaining({
                    values
                })
            });
        });
    });
});
