import React, { ReactNode, useEffect } from 'react';
import { Container, MantineProvider } from '@mantine/core';
import { InputFieldRegistryProvider, ThemeKeys, TooltipProvider, containerStyles, resolver, themes } from '@clinicaltoolkits/universal-react-components';
import { createCTSupabaseClient, getSupabaseClient, logger, setSupabaseClient } from '@clinicaltoolkits/utility-functions';
import { DescriptiveRatingTable, VariableProvider, VariableSetSelector, VariableTable, fetchVariableSets, useVariableContext, variableComponentRegistry, variableTypesWithTwoFields } from '../src/index';
import { useEditor } from "@tiptap/react";
import { contentBlockComponentRegistry, ContentBlockWrapperOptionsProvider, defaultExtensions, InfoFieldNodeProvider } from '@clinicaltoolkits/content-blocks';
import { RichTextEditor as MantineRichTextEditor } from '@mantine/tiptap';

const componentRegistry = {
  ...variableComponentRegistry,
  ...contentBlockComponentRegistry
}

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
      <InputFieldRegistryProvider registry={componentRegistry} dataTypesWithTwoFields={variableTypesWithTwoFields}>
        <TooltipProvider>
          <VariableProvider>
            <Test />
          </VariableProvider>
        </TooltipProvider>
      </InputFieldRegistryProvider>
    </MantineProvider>
  );
};

/*
const Test: React.FC = () => {
  const editor = useEditor({ extensions: defaultExtensions, editable: false });

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
    <MantineRichTextEditor editor={editor}>
      <Container className={containerStyles.mainContent}>
        <VariableTable />
        <VariableSetSelector />
        <DescriptiveRatingTable />
      </Container>
    </MantineRichTextEditor>
  ) : <div>...Signing in</div>;
};
*/

const bInitializeVariables = true;
const Test: React.FC = () => {
  const [bInitialized, setInitialized] = React.useState(false);
  const { addVariableSet } = useVariableContext();

  const handleSignIn = async () => {
    const authTokenResponse = await getSupabaseClient().auth.signInWithPassword({ email: "nicholaskhendrickson@gmail.com", password: "Zargoth.2" });
    if (authTokenResponse.error) {
      console.error("Error signing in: ", authTokenResponse.error);
      return null;
    }
    console.log("Signed in successfully");
  };

  const handleInitializeVariables = async () => {
    if (bInitializeVariables) {
      const variableSets = await fetchVariableSets(["7c7576d4-704f-4a8a-aff3-793aea573e07", "5ac2937c-39a5-4638-b510-f58a023e9d96"]);
      variableSets.forEach((variableSet) => {
        addVariableSet(variableSet);
      });
    } else {
      logger.log("Skipping variable initialization in Test component.");
    }
  };

  const handleInitializeTest = async () => {
    if (bInitialized === false) {
      await handleSignIn();
      await handleInitializeVariables();
      setInitialized(true);
    }
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