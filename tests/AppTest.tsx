import React, { ReactNode, useEffect } from 'react';
import { Container, MantineProvider } from '@mantine/core';
import { InputFieldRegistryProvider, ThemeKeys, containerStyles, resolver, themes } from '@clinicaltoolkits/universal-react-components';
import { createCTSupabaseClient, getSupabaseClient, setSupabaseClient } from '@clinicaltoolkits/utility-functions';
import { DescriptiveRatingTable, VariableProvider, VariableSetSelector, VariableTable, fetchVariableSets, useVariableContext, variableComponentRegistry, variableTypesWithTwoFields } from '../src/index';

interface TestContextWrapperProps {
  children?: ReactNode;  // Define children as an optional prop
}

export const TestContextWrapper: React.FC<TestContextWrapperProps> = ({ children }) => {

  const ctSupabaseClientConfig = {
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3cWdva29wc2Ntc2doa3BhcHdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY5MTEyMjcxMCwiZXhwIjoyMDA2Njk4NzEwfQ.O9oWtzaMPe5rzs_xt9rieWsw4iROMu42XEja1iIdqA4" // This is the servic_role key it should only be used for testing, allows overriding RLS policies
  }
  const supabaseClient = createCTSupabaseClient(ctSupabaseClientConfig);
  setSupabaseClient(supabaseClient);

  return (
    <MantineProvider theme={themes[ThemeKeys.Default]} cssVariablesResolver={resolver(ThemeKeys.Default)} defaultColorScheme='auto'>
      <InputFieldRegistryProvider registry={variableComponentRegistry} dataTypesWithTwoFields={variableTypesWithTwoFields}>
        <VariableProvider>
          <Test />
        </VariableProvider>
      </InputFieldRegistryProvider>
    </MantineProvider>
  );
};

const Test: React.FC = () => {
  const { addVariableSet } = useVariableContext();
  const [bInitialized, setInitialized] = React.useState(false);

  const handleSignIn = async () => {
    const authTokenResponse = await getSupabaseClient().auth.signInWithPassword({ email: "nicholaskhendrickson@gmail.com", password: "Zargoth.2" });
    if (authTokenResponse.error) {
      console.error("Error signing in: ", authTokenResponse.error);
      return null;
    }
    console.log("Signed in successfully");
  };

  const handleInitializeVariables = async () => {
    const variableSets = await fetchVariableSets();
    variableSets.forEach((variableSet) => {
      addVariableSet(variableSet);
    });
  };

  const handleInitializeTest = async () => {
    await handleSignIn();
    await handleInitializeVariables();
    setInitialized(true);
  };
  
  useEffect(() => {
    handleInitializeTest();
  }, [getSupabaseClient()]);

  return bInitialized ? (
    <Container className={containerStyles.mainContent}>
      <VariableTable />
      <VariableSetSelector />
      <DescriptiveRatingTable />
    </Container>
  ) : <div>...Signing in</div>;
};