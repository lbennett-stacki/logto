import { withAppInsights } from '@logto/app-insights/react';
import { ServiceConnector } from '@logto/connector-kit';
import { type AdminConsoleKey } from '@logto/phrases';
import { ConnectorType } from '@logto/schemas';
import type { ConnectorFactoryResponse } from '@logto/schemas';
import { conditional } from '@silverhand/essentials';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import useSWR from 'swr';

import Plus from '@/assets/icons/plus.svg';
import SocialConnectorEmptyDark from '@/assets/images/social-connector-empty-dark.svg';
import SocialConnectorEmpty from '@/assets/images/social-connector-empty.svg';
import CreateConnectorForm from '@/components/CreateConnectorForm';
import ListPage from '@/components/ListPage';
import { defaultEmailConnectorGroup, defaultSmsConnectorGroup } from '@/consts';
import { ConnectorsTabs } from '@/consts/page-tabs';
import Button from '@/ds-components/Button';
import TabNav, { TabNavItem } from '@/ds-components/TabNav';
import TablePlaceholder from '@/ds-components/Table/TablePlaceholder';
import type { RequestError } from '@/hooks/use-api';
import useConnectorApi from '@/hooks/use-connector-api';
import useConnectorGroups from '@/hooks/use-connector-groups';
import useDocumentationUrl from '@/hooks/use-documentation-url';
import useTenantPathname from '@/hooks/use-tenant-pathname';
import DemoConnectorNotice from '@/onboarding/components/DemoConnectorNotice';
import { type ConnectorGroup } from '@/types/connector';

import ConnectorDeleteButton from './ConnectorDeleteButton';
import ConnectorName from './ConnectorName';
import ConnectorStatus from './ConnectorStatus';
import ConnectorStatusField from './ConnectorStatusField';
import ConnectorTypeColumn from './ConnectorTypeColumn';
import Guide from './Guide';
import SignInExperienceSetupNotice from './SignInExperienceSetupNotice';
import * as styles from './index.module.scss';

const basePathname = '/connectors';
const passwordlessPathname = `${basePathname}/${ConnectorsTabs.Passwordless}`;
const socialPathname = `${basePathname}/${ConnectorsTabs.Social}`;
const blockchainPathname = `${basePathname}/${ConnectorsTabs.Blockchain}`;

const buildTabPathname = (connectorType: ConnectorType) => {
  const tabPathMap = {
    [ConnectorType.Social]: socialPathname,
    [ConnectorType.Blockchain]: blockchainPathname,
    [ConnectorType.Email]: passwordlessPathname,
    [ConnectorType.Sms]: passwordlessPathname,
  };
  return tabPathMap[connectorType] || tabPathMap[ConnectorType.Email];
};

const buildCreatePathname = (connectorType: ConnectorType) => {
  const tabPath = buildTabPathname(connectorType);

  return `${tabPath}/create/${connectorType}`;
};

const buildGuidePathname = (connectorType: ConnectorType, factoryId: string) => {
  const tabPath = buildTabPathname(connectorType);

  return `${tabPath}/guide/${factoryId}`;
};

const isConnectorType = (value: string): value is ConnectorType =>
  Object.values<string>(ConnectorType).includes(value);

const parseToConnectorType = (value?: string): ConnectorType | undefined =>
  conditional(value && isConnectorType(value) && value);

const isConnectorTab = (value: string): value is ConnectorsTabs =>
  Object.values<string>(ConnectorsTabs).includes(value);

const parseToConnectorTab = (value?: string): ConnectorsTabs | undefined =>
  conditional(value && isConnectorTab(value) && value);

const documentationUrlMap = {
  [ConnectorsTabs.Social]: '/docs/recipes/configure-connectors/configure-social-connector',
  [ConnectorsTabs.Blockchain]: '/docs/recipes/configure-connectors/configure-blockchain-connector',
};

function Connectors() {
  const { tab, createType, factoryId } = useParams();
  const createConnectorType = parseToConnectorType(createType);
  const createConnectorTab = parseToConnectorTab(tab) ?? ConnectorsTabs.Passwordless;
  const { navigate } = useTenantPathname();
  const { t } = useTranslation(undefined, { keyPrefix: 'admin_console' });
  const { getDocumentationUrl } = useDocumentationUrl();
  const { createConnector } = useConnectorApi();
  const { data, error, mutate } = useConnectorGroups();
  const { data: factories, error: factoriesError } = useSWR<
    ConnectorFactoryResponse[],
    RequestError
  >('api/connector-factories');

  const isLoading = !data && !factories && !error && !factoriesError;

  const passwordlessConnectors = useMemo(() => {
    const emailConnector =
      data?.find(({ type }) => type === ConnectorType.Email) ?? defaultEmailConnectorGroup;

    const smsConnector =
      data?.find(({ type }) => type === ConnectorType.Sms) ?? defaultSmsConnectorGroup;

    return [emailConnector, smsConnector];
  }, [data]);

  const socialConnectors = useMemo(
    () => data?.filter(({ type }) => type === ConnectorType.Social) ?? [],
    [data]
  );

  const blockchainConnectors = useMemo(
    () => data?.filter(({ type }) => type === ConnectorType.Blockchain) ?? [],
    [data]
  );

  const connectorTabMap: Record<ConnectorsTabs, ConnectorGroup[]> = {
    [ConnectorsTabs.Social]: socialConnectors,
    [ConnectorsTabs.Blockchain]: blockchainConnectors,
    [ConnectorsTabs.Passwordless]: passwordlessConnectors,
  };

  const isSocial = tab === ConnectorsTabs.Social;
  const isBlockchain = tab === ConnectorsTabs.Blockchain;
  const isCreatable = isSocial || isBlockchain;

  const connectors = connectorTabMap[createConnectorTab];

  const hasDemoConnector = connectors.some(({ isDemo }) => isDemo);

  const connectorToShowInGuide = useMemo(() => {
    if (factories && factoryId) {
      return factories.find(({ id }) => id === factoryId);
    }
  }, [factoryId, factories]);

  const createButtonTitle = useMemo((): AdminConsoleKey => {
    if (createConnectorType === ConnectorType.Blockchain) {
      return 'connectors.create';
    }

    return 'connectors.create';
  }, [createConnectorType]);

  const placeholderTitle = useMemo((): AdminConsoleKey => {
    if (createConnectorType === ConnectorType.Blockchain) {
      return 'connectors.placeholder_title';
    }

    return 'connectors.placeholder_title';
  }, [createConnectorType]);

  const placeholderDescription = useMemo((): AdminConsoleKey => {
    if (createConnectorType === ConnectorType.Blockchain) {
      return 'connectors.placeholder_description';
    }
    return 'connectors.placeholder_description';
  }, [createConnectorType]);

  return (
    <ListPage
      className={styles.container}
      title={{
        title: 'connectors.title',
        subtitle: 'connectors.subtitle',
      }}
      pageMeta={{ titleKey: 'connectors.page_title' }}
      createButton={conditional(
        isCreatable && {
          title: createButtonTitle,
          onClick: () => {
            if (createConnectorType) {
              navigate(buildCreatePathname(createConnectorType));
            }
          },
        }
      )}
      subHeader={
        <>
          <SignInExperienceSetupNotice />
          <TabNav className={styles.tabs}>
            <TabNavItem href={passwordlessPathname}>{t('connectors.tab_email_sms')}</TabNavItem>
            <TabNavItem href={socialPathname}>{t('connectors.tab_social')}</TabNavItem>
            <TabNavItem href={blockchainPathname}>{t('connectors.tab_social')}</TabNavItem>
          </TabNav>
          {hasDemoConnector && <DemoConnectorNotice />}
        </>
      }
      table={{
        rowIndexKey: 'id',
        rowGroups: [{ key: 'connectors', data: connectors }],
        columns: [
          {
            title: t('connectors.connector_name'),
            dataIndex: 'name',
            colSpan: 6,
            render: (connectorGroup) => (
              <ConnectorName connectorGroup={connectorGroup} isDemo={connectorGroup.isDemo} />
            ),
          },
          {
            title: t('connectors.connector_type'),
            dataIndex: 'type',
            colSpan: 5,
            render: (connectorGroup) => <ConnectorTypeColumn connectorGroup={connectorGroup} />,
          },
          {
            title: <ConnectorStatusField />,
            dataIndex: 'status',
            colSpan: 4,
            render: (connectorGroup) => <ConnectorStatus connectorGroup={connectorGroup} />,
          },
          {
            title: null,
            dataIndex: 'delete',
            colSpan: 1,
            render: (connectorGroup) =>
              connectorGroup.isDemo ? (
                <ConnectorDeleteButton connectorGroup={connectorGroup} />
              ) : null,
          },
        ],
        isRowClickable: ({ connectors }) => Boolean(connectors[0]) && !connectors[0]?.isDemo,
        rowClickHandler: ({ connectors }) => {
          const firstConnector = connectors[0];

          if (!firstConnector) {
            return;
          }

          const { type, id } = firstConnector;

          navigate(
            `${type === ConnectorType.Social ? socialPathname : passwordlessPathname}/${id}`
          );
        },
        isLoading,
        errorMessage: error?.body?.message ?? error?.message,
        placeholder: conditional(
          isCreatable && (
            <TablePlaceholder
              image={<SocialConnectorEmpty />}
              imageDark={<SocialConnectorEmptyDark />}
              title={placeholderTitle}
              description={placeholderDescription}
              learnMoreLink={getDocumentationUrl(documentationUrlMap[tab])}
              action={
                <Button
                  title={createButtonTitle}
                  type="primary"
                  size="large"
                  icon={<Plus />}
                  onClick={() => {
                    if (createConnectorType) {
                      navigate(buildCreatePathname(createConnectorType));
                    }
                  }}
                />
              }
            />
          )
        ),
        onRetry: async () => mutate(undefined, true),
      }}
      widgets={
        <>
          <CreateConnectorForm
            isOpen={Boolean(createConnectorType)}
            type={createConnectorType}
            onClose={async (id) => {
              if (createConnectorType && id) {
                /**
                 * Note:
                 * The "Email Service Connector" is a built-in connector that can be directly created without the need for setup in the guide.
                 */
                if (id === ServiceConnector.Email) {
                  const created = await createConnector({ connectorId: id });
                  navigate(`/connectors/${ConnectorsTabs.Passwordless}/${created.id}`, {
                    replace: true,
                  });
                  return;
                }

                navigate(buildGuidePathname(createConnectorType, id), { replace: true });

                return;
              }
              navigate(`${basePathname}/${createConnectorTab}`);
            }}
          />
          <Guide
            connector={connectorToShowInGuide}
            onClose={() => {
              navigate(`${basePathname}/${createConnectorTab}`);
            }}
          />
        </>
      }
    />
  );
}

export default withAppInsights(Connectors);
