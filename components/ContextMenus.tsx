
import React from 'react';
import { ContextMenu, CanvasContextMenu, RelationshipContextMenu } from './ModalComponents';
import { Element, Relationship } from '../types';

interface ContextMenusProps {
    contextMenu: { x: number, y: number, elementId: string, boardId?: string } | null;
    relationshipContextMenu: { x: number, y: number, relationshipId: string } | null;
    canvasContextMenu: { x: number, y: number } | null;
    relationships: Relationship[];
    elements: Element[];
    panelState: any;
    persistence: any;

    onCloseContextMenu: () => void;
    onCloseRelationshipContextMenu: () => void;
    onCloseCanvasContextMenu: () => void;

    onDeleteElement: (id: string) => void;
    onAddRelationshipFromContext: (id: string) => void;
    onDeleteRelationship: (id: string) => void;
    onChangeRelationshipDirection: (id: string, dir: any) => void;
    onZoomToFit: () => void;
    onAutoLayout: () => void;
    onSaveAsImage: () => void;
    importFileRef: any;
    isDarkMode: boolean;
    onToggleNodeHighlight?: (id: string) => void;
    onHideFromView?: (id: string) => void;

    multiSelection: Set<string>;
    onAddToKanban: (ids: string[], coords: { x: number; y: number }, boardId?: string) => void;
    onRemoveFromKanban: (ids: string[], boardId?: string) => void;
    onMoveToBoard: (ids: string[], targetBoardId: string, sourceBoardId?: string) => void;
    onCreateBoardAndMove: (ids: string[], newBoardName: string) => void;
    onCreateBoardAndAdd: (ids: string[], newBoardName: string) => void;
    onMoveToColumn: (ids: string[], column: string, boardId?: string) => void;
    kanbanBoards?: any[]; // KanbanBoard[]
    activeKanbanBoardId?: string | null;
}

export const ContextMenus: React.FC<ContextMenusProps> = (props) => {
    const {
        contextMenu, relationshipContextMenu, canvasContextMenu,
        persistence, panelState, isDarkMode, elements
    } = props;

    if (!persistence.currentModelId) return null;

    return (
        <>
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={props.onCloseContextMenu}
                    onDeleteElement={() => { props.onDeleteElement(contextMenu.elementId); props.onCloseContextMenu(); }}
                    onAddRelationship={() => { props.onAddRelationshipFromContext(contextMenu.elementId); props.onCloseContextMenu(); }}
                    onToggleHighlight={props.onToggleNodeHighlight ? () => { props.onToggleNodeHighlight!(contextMenu.elementId); props.onCloseContextMenu(); } : undefined}
                    isHighlighted={!!elements.find(e => e.id === contextMenu.elementId)?.meta?.highlightColor}
                    onHideFromView={props.onHideFromView ? () => { props.onHideFromView!(contextMenu.elementId); props.onCloseContextMenu(); } : undefined}

                    multiSelection={props.multiSelection}
                    onAddToKanban={props.onAddToKanban}
                    onRemoveFromKanban={props.onRemoveFromKanban}
                    onMoveToBoard={(ids, target) => props.onMoveToBoard(ids, target, contextMenu.boardId)}
                    onCreateBoardAndMove={props.onCreateBoardAndMove}
                    onCreateBoardAndAdd={props.onCreateBoardAndAdd}
                    onMoveToColumn={props.onMoveToColumn}
                    elementId={contextMenu.elementId}
                    kanbanBoards={props.kanbanBoards}
                    activeKanbanBoardId={props.activeKanbanBoardId}
                    belongingBoards={props.kanbanBoards?.filter(b => {
                        if (contextMenu.boardId && b.id === contextMenu.boardId) return true;
                        const el = elements.find(e => e.id === contextMenu.elementId);
                        return el && (el as any)[b.attributeKey];
                    })}
                />
            )}

            {relationshipContextMenu && (
                <RelationshipContextMenu
                    x={relationshipContextMenu.x}
                    y={relationshipContextMenu.y}
                    relationship={props.relationships.find(r => r.id === relationshipContextMenu.relationshipId)!}
                    onClose={props.onCloseRelationshipContextMenu}
                    onDelete={() => { props.onDeleteRelationship(relationshipContextMenu.relationshipId); props.onCloseRelationshipContextMenu(); }}
                    onChangeDirection={(dir) => props.onChangeRelationshipDirection(relationshipContextMenu.relationshipId, dir)}
                    isDarkMode={isDarkMode}
                />
            )}

            {canvasContextMenu && (
                <CanvasContextMenu
                    x={canvasContextMenu.x}
                    y={canvasContextMenu.y}
                    onClose={props.onCloseCanvasContextMenu}
                    onZoomToFit={props.onZoomToFit}
                    onAutoLayout={props.onAutoLayout}
                    onToggleReport={() => panelState.setIsReportPanelOpen((p: any) => !p)}
                    onToggleMarkdown={() => panelState.setIsMarkdownPanelOpen((p: any) => !p)}
                    onToggleJSON={() => panelState.setIsJSONPanelOpen((p: any) => !p)}
                    onToggleFilter={() => panelState.setIsFilterPanelOpen((p: any) => !p)}
                    onToggleMatrix={() => panelState.setIsMatrixPanelOpen((p: any) => !p)}
                    onToggleTable={() => panelState.setIsTablePanelOpen((p: any) => !p)}
                    onToggleGrid={() => panelState.setIsGridPanelOpen((p: any) => !p)}
                    onOpenModel={() => persistence.handleImportClick(props.importFileRef)}
                    onSaveModel={persistence.handleDiskSave}
                    onCreateModel={persistence.handleNewModelClick}
                    onSaveAs={() => persistence.setIsSaveAsModalOpen(true)}
                    onSaveAsImage={props.onSaveAsImage}
                    isReportOpen={panelState.isReportPanelOpen}
                    isMarkdownOpen={panelState.isMarkdownPanelOpen}
                    isJSONOpen={panelState.isJSONPanelOpen}
                    isFilterOpen={panelState.isFilterPanelOpen}
                    isMatrixOpen={panelState.isMatrixPanelOpen}
                    isTableOpen={panelState.isTablePanelOpen}
                    isGridOpen={panelState.isGridPanelOpen}
                    isDarkMode={isDarkMode}

                    multiSelection={props.multiSelection}
                    onAddToKanban={props.onAddToKanban}
                    allElementIds={elements.map(e => e.id)}
                    kanbanBoards={props.kanbanBoards}
                    activeKanbanBoardId={props.activeKanbanBoardId}
                />
            )}
        </>
    );
}
