

import React from 'react';
import ScamperModal from './ScamperModal';
import TrizModal from './TrizModal';
import LssModal from './LssModal';
import TocModal from './TocModal';
import SsmModal from './SsmModal';
import SwotModal from './SwotModal';
import SettingsModal from './SettingsModal';
import { SchemaUpdateModal } from './SchemaUpdateModal';
import { SelfTestModal } from './SelfTestModal';
import { UserGuideModal } from './UserGuideModal';
import { AboutModal, PatternGalleryModal, ConflictResolutionModal, CreateModelModal, SaveAsModal, OpenModelModal } from './ModalComponents';
import { Element, Relationship, ModelActions, TapestryDocument, TapestryFolder, SystemPromptConfig, GlobalSettings, CustomStrategyTool } from '../types';

interface AppModalsProps {
  tools: any;
  panelState: any;
  persistence: any;
  elements: Element[];
  relationships: Relationship[];
  selectedElementId: string | null;
  modelActions: ModelActions;
  documents: TapestryDocument[];
  folders: TapestryFolder[];
  onUpdateDocument: (id: string, updates: any) => void;
  handleAnalyzeWithChat: (context: string) => void;
  handleLogHistory: (tool: string, content: string, summary?: string, subTool?: string, toolParams?: any) => void;
  defaultTags: string[];
  aiConfig: any;
  isDarkMode: boolean;
  globalSettings: GlobalSettings;
  handleGlobalSettingsChange: (settings: GlobalSettings) => void;
  systemPromptConfig: SystemPromptConfig;
  setSystemPromptConfig: (config: SystemPromptConfig) => void;
  
  // Settings specific
  isSettingsModalOpen: boolean;
  setIsSettingsModalOpen: (open: boolean) => void;
  settingsInitialTab: any;
  
  // Modal specific
  isAboutModalOpen: boolean;
  setIsAboutModalOpen: (open: boolean) => void;
  isPatternGalleryModalOpen: boolean;
  setIsPatternGalleryModalOpen: (open: boolean) => void;
  isUserGuideModalOpen: boolean;
  setIsUserGuideModalOpen: (open: boolean) => void;
  
  // Self Test
  isSelfTestModalOpen: boolean;
  setIsSelfTestModalOpen: (open: boolean) => void;
  testLogs: any[];
  testStatus: any;
  
  // Imports
  importFileRef: any;
  
  handleCustomStrategiesChange: (strategies: CustomStrategyTool[]) => void;
  getToolPrompt: (tool: string, subTool?: string) => string;
}

export const AppModals: React.FC<AppModalsProps> = (props) => {
    const { tools, panelState, persistence, elements, relationships, modelActions, documents, folders, aiConfig, isDarkMode } = props;

    return (
        <>
            <ScamperModal isOpen={tools.isScamperModalOpen} onClose={() => tools.setIsScamperModalOpen(false)} elements={elements} relationships={relationships} selectedElementId={props.selectedElementId} modelActions={modelActions} triggerOp={tools.scamperTrigger} onClearTrigger={() => tools.setScamperTrigger(null)} documents={documents} folders={folders} onUpdateDocument={props.onUpdateDocument} modelName={persistence.currentModelName} initialDoc={tools.scamperInitialDoc} onLogHistory={props.handleLogHistory} defaultTags={props.defaultTags} aiConfig={aiConfig} />
            <TrizModal 
                isOpen={tools.isTrizModalOpen} 
                activeTool={tools.activeTrizTool} 
                elements={elements} 
                relationships={relationships} 
                modelActions={modelActions} 
                documents={documents} 
                folders={folders} 
                onUpdateDocument={props.onUpdateDocument} 
                initialParams={tools.trizInitialParams} 
                onClose={() => tools.setIsTrizModalOpen(false)} 
                onLogHistory={props.handleLogHistory} 
                onOpenHistory={() => panelState.setIsHistoryPanelOpen(true)} 
                onAnalyze={props.handleAnalyzeWithChat} 
                customPrompt={props.getToolPrompt('triz', tools.activeTrizTool)} 
                aiConfig={aiConfig} 
                onOpenGuidance={() => tools.handleOpenGuidance('triz-' + tools.activeTrizTool)}
                isDarkMode={isDarkMode}
            />
            <LssModal isOpen={tools.isLssModalOpen} activeTool={tools.activeLssTool} elements={elements} relationships={relationships} modelActions={modelActions} documents={documents} folders={folders} onUpdateDocument={props.onUpdateDocument} initialParams={tools.lssInitialParams} onClose={() => tools.setIsLssModalOpen(false)} onLogHistory={props.handleLogHistory} onOpenHistory={() => panelState.setIsHistoryPanelOpen(true)} onAnalyze={props.handleAnalyzeWithChat} customPrompt={props.getToolPrompt('lss', tools.activeLssTool)} aiConfig={aiConfig} isDarkMode={isDarkMode} />
            <TocModal isOpen={tools.isTocModalOpen} activeTool={tools.activeTocTool} elements={elements} relationships={relationships} modelActions={modelActions} documents={documents} folders={folders} onUpdateDocument={props.onUpdateDocument} initialParams={tools.tocInitialParams} onClose={() => tools.setIsTocModalOpen(false)} onLogHistory={props.handleLogHistory} onOpenHistory={() => panelState.setIsHistoryPanelOpen(true)} onAnalyze={props.handleAnalyzeWithChat} customPrompt={props.getToolPrompt('toc', tools.activeTocTool)} aiConfig={aiConfig} isDarkMode={isDarkMode} />
            <SsmModal isOpen={tools.isSsmModalOpen} activeTool={tools.activeSsmTool} elements={elements} relationships={relationships} modelActions={modelActions} documents={documents} folders={folders} onUpdateDocument={props.onUpdateDocument} initialParams={tools.ssmInitialParams} onClose={() => tools.setIsSsmModalOpen(false)} onLogHistory={props.handleLogHistory} onOpenHistory={() => panelState.setIsHistoryPanelOpen(true)} onAnalyze={props.handleAnalyzeWithChat} customPrompt={props.getToolPrompt('ssm', tools.activeSsmTool)} aiConfig={aiConfig} isDarkMode={isDarkMode} />
            <SwotModal 
                isOpen={tools.isSwotModalOpen} 
                activeTool={tools.activeSwotTool} 
                elements={elements} 
                relationships={relationships} 
                modelActions={modelActions} 
                documents={documents} 
                folders={folders} 
                onUpdateDocument={props.onUpdateDocument} 
                onClose={() => tools.setIsSwotModalOpen(false)} 
                onLogHistory={props.handleLogHistory} 
                onOpenHistory={() => panelState.setIsHistoryPanelOpen(true)} 
                modelName={persistence.currentModelName} 
                initialDoc={tools.swotInitialDoc} 
                aiConfig={aiConfig} 
                isDarkMode={isDarkMode} 
                customStrategies={props.globalSettings.customStrategies} 
                onSaveCustomStrategies={props.handleCustomStrategiesChange} 
                onOpenGuidance={() => tools.handleOpenGuidance('strategy')}
            />
            <SettingsModal isOpen={props.isSettingsModalOpen} onClose={() => props.setIsSettingsModalOpen(false)} initialTab={props.settingsInitialTab} globalSettings={props.globalSettings} onGlobalSettingsChange={props.handleGlobalSettingsChange} modelSettings={props.systemPromptConfig} onModelSettingsChange={props.setSystemPromptConfig} isDarkMode={isDarkMode} />
            {persistence.isSchemaUpdateModalOpen && <SchemaUpdateModal changes={persistence.schemaUpdateChanges} onClose={() => persistence.setIsSchemaUpdateModalOpen(false)} />}
            <SelfTestModal isOpen={props.isSelfTestModalOpen} onClose={() => props.setIsSelfTestModalOpen(false)} logs={props.testLogs} status={props.testStatus} isDarkMode={isDarkMode} />
            {props.isUserGuideModalOpen && <UserGuideModal onClose={() => props.setIsUserGuideModalOpen(false)} isDarkMode={isDarkMode} />}
            
            {/* Persistence Modals */}
            {persistence.isCreateModelModalOpen && <CreateModelModal onCreate={persistence.handleCreateModel} onClose={() => persistence.setIsCreateModelModalOpen(false)} isInitialSetup={false} />}
            {persistence.isSaveAsModalOpen && <SaveAsModal currentName={persistence.modelsIndex.find((m:any) => m.id === persistence.currentModelId)?.name || ''} currentDesc={persistence.modelsIndex.find((m:any) => m.id === persistence.currentModelId)?.description || ''} onSave={persistence.handleSaveAs} onClose={() => persistence.setIsSaveAsModalOpen(false)} />}
            {persistence.isOpenModelModalOpen && <OpenModelModal models={persistence.modelsIndex} onLoad={persistence.handleLoadModel} onClose={() => persistence.setIsOpenModelModalOpen(false)} onTriggerCreate={() => { persistence.setIsOpenModelModalOpen(false); persistence.setIsCreateModelModalOpen(true); }} />}
            {persistence.pendingImport && (
                <ConflictResolutionModal localMetadata={persistence.pendingImport.localMetadata} diskMetadata={persistence.pendingImport.diskMetadata} localData={persistence.pendingImport.localData} diskData={persistence.pendingImport.diskData} onCancel={() => persistence.setPendingImport(null)} onChooseLocal={() => { persistence.handleLoadModel(persistence.pendingImport!.localMetadata.id); persistence.setPendingImport(null); }} onChooseDisk={() => { persistence.loadModelData(persistence.pendingImport!.diskData, persistence.pendingImport!.diskMetadata.id, persistence.pendingImport!.diskMetadata); persistence.setPendingImport(null); }} />
            )}
            {props.isAboutModalOpen && <AboutModal onClose={() => props.setIsAboutModalOpen(false)} onUserGuideClick={() => { props.setIsAboutModalOpen(false); props.setIsUserGuideModalOpen(true); }} isDarkMode={isDarkMode} />}
            {props.isPatternGalleryModalOpen && <PatternGalleryModal onClose={() => props.setIsPatternGalleryModalOpen(false)} isDarkMode={isDarkMode} />}
        </>
    );
};