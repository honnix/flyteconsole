import * as React from 'react';

import { SectionHeader } from 'components/common';
import { useCommonStyles } from 'components/common/styles';
import { NodeDetailsProps } from 'components/WorkflowGraph';
import { useStyles as useBaseStyles } from 'components/WorkflowGraph/NodeDetails/styles';

import { LiteralMapViewer } from 'components/Literals';
import { ExecutionContext } from '../../contexts';

/** Details panel renderer for the start/input node in a graph. Displays the
 * top level `WorkflowExecution` inputs.
 */
export const InputNodeDetails: React.FC<NodeDetailsProps> = () => {
    const baseStyles = useBaseStyles();
    const commonStyles = useCommonStyles();
    const { execution } = React.useContext(ExecutionContext);

    return (
        <section className={baseStyles.container}>
            <header className={baseStyles.header}>
                <div className={baseStyles.headerContent}>
                    <SectionHeader title="Execution Inputs" />
                </div>
            </header>
            <div className={baseStyles.content}>
                <div className={commonStyles.detailsPanelCard}>
                    <div className={commonStyles.detailsPanelCardContent}>
                        <LiteralMapViewer
                            map={execution.closure.computedInputs}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};
