import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { getCallbackLinkFromStorage } from '@/utils/connectors/social-connectors';

const useSocialCallbackHandler = () => {
  const navigate = useNavigate();

  const socialCallbackHandler = useCallback(
    (connectorId: string) => {
      // Get search parameter to evaluate
      const searchParams = new URLSearchParams(window.location.search);
      // Get hash parameter to evaluate
      const hashParams = new URLSearchParams(window.location.hash.slice(1));

      // Join search and hash parameters
      const joinedSearchParams = new URLSearchParams([...searchParams, ...hashParams]);
      const search = joinedSearchParams.toString() ? `?${joinedSearchParams.toString()}` : '';

      // Get native callback link from storage
      const callbackLink = getCallbackLinkFromStorage(connectorId);

      if (callbackLink) {
        window.location.replace(new URL(`${callbackLink}${search}`));

        return;
      }

      // Web flow
      navigate(
        {
          pathname: `/sign-in/social/${connectorId}`,
          search,
        },
        {
          replace: true,
        }
      );
    },
    [navigate]
  );

  return { socialCallbackHandler };
};

export default useSocialCallbackHandler;
