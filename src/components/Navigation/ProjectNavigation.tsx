import { makeStyles, Theme } from '@material-ui/core/styles';
import { SvgIconProps } from '@material-ui/core/SvgIcon';
import ChevronRight from '@material-ui/icons/ChevronRight';
import DeviceHub from '@material-ui/icons/DeviceHub';
import * as classnames from 'classnames';
import { withRouteParams } from 'components/common';
import { useCommonStyles } from 'components/common/styles';
import { useProject, useProjects, useQueryState } from 'components/hooks';
import { Project } from 'models';
import * as React from 'react';
import { matchPath, NavLink, NavLinkProps } from 'react-router-dom';
import { history } from 'routes/history';
import { Routes } from 'routes/routes';
import { ProjectSelector } from './ProjectSelector';

interface ProjectNavigationRouteParams {
    domainId?: string;
    projectId: string;
    host?: string;
    section?: string;
}

const useStyles = makeStyles((theme: Theme) => ({
    navLinksContainer: {
        marginTop: theme.spacing(1)
    },
    navLink: {
        alignItems: 'center',
        borderLeft: '4px solid transparent',
        color: theme.palette.text.secondary,
        display: 'flex',
        height: theme.spacing(6),
        padding: `0 ${theme.spacing(2)}px`,
        '&:hover': {
            borderColor: theme.palette.primary.main
        }
    },
    navLinkActive: {
        color: theme.palette.text.primary,
        fontWeight: 600
    },
    navLinkChevron: {
        color: theme.palette.grey[500],
        flex: '0 0 auto'
    },
    navLinkIcon: {
        marginRight: theme.spacing(2)
    },
    navLinkText: {
        flex: '1 1 auto'
    }
}));

interface ProjectRoute extends Pick<NavLinkProps, 'isActive'> {
    icon: React.ComponentType<SvgIconProps>;
    path: string;
    text: string;
}

const ProjectNavigationImpl: React.FC<ProjectNavigationRouteParams> = ({
    domainId,
    projectId,
    section,
    host
}) => {
    const styles = useStyles();
    const commonStyles = useCommonStyles();
    // TODO, we might not need the question mark on host here.
    // looks like useQueryState considers it a Partial
    const { params, setQueryState } = useQueryState<{
        domain: string;
        host?: string;
    }>();
    const project = useProject(projectId);
    const projects = useProjects(params.host);
    const onProjectSelected = (project: Project) =>
        history.push(Routes.ProjectDetails.makeUrl(project.id, section));

    const routes: ProjectRoute[] = [
        {
            icon: DeviceHub,
            isActive: (match, location) => {
                const finalMatch = match
                    ? match
                    : matchPath(location.pathname, {
                          path: Routes.WorkflowDetails.path,
                          exact: false
                      });
                return !!finalMatch;
            },
            path: Routes.ProjectDetails.sections.workflows.makeUrl(
                project.value.id,
                domainId
            ),
            text: 'Workflows'
        }
    ];

    return (
        <>
            {project.value &&
                projects.value && (
                    <ProjectSelector
                        projects={projects.value}
                        selectedProject={project.value}
                        onProjectSelected={onProjectSelected}
                    />
                )}
            <div className={styles.navLinksContainer}>
                {Object.values(routes).map(
                    ({ isActive, path, icon: Icon, text }) => (
                        <NavLink
                            activeClassName={styles.navLinkActive}
                            className={classnames(
                                commonStyles.linkUnstyled,
                                styles.navLink
                            )}
                            isActive={isActive}
                            key={path}
                            to={path}
                        >
                            <Icon className={styles.navLinkIcon} />
                            <span className={styles.navLinkText}>{text}</span>
                            <ChevronRight className={styles.navLinkChevron} />
                        </NavLink>
                    )
                )}
            </div>
        </>
    );
};

/** Renders the left side navigation between and within projects */
export const ProjectNavigation = withRouteParams<ProjectNavigationRouteParams>(
    ProjectNavigationImpl
);
