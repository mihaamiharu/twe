import React, { useState, useMemo } from 'react';
import {
    File,
    Folder,
    FolderOpen,
    Lock,
    Edit3,
    ChevronRight,
    ChevronDown,
    FileCode,
    Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileExplorerProps {
    files: Record<string, string>;
    editableFiles?: string[];
    selectedFile: string;
    onSelectFile: (path: string) => void;
    className?: string;
}

interface FileNode {
    name: string;
    path: string;
    type: 'file' | 'folder';
    children?: Record<string, FileNode>;
}

export function FileExplorer({
    files,
    editableFiles = [],
    selectedFile,
    onSelectFile,
    className,
}: FileExplorerProps) {
    // State for expanded folders
    const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
        '': true, // Root always expanded
    });

    // Convert flat files Record to a hierarchical tree
    const fileTree = useMemo(() => {
        const root: FileNode = { name: '', path: '', type: 'folder', children: {} };

        Object.keys(files).forEach((path) => {
            const parts = path.split('/').filter(Boolean);
            let current = root;

            parts.forEach((part, index) => {
                if (!current.children) current.children = {};

                if (!current.children[part]) {
                    const isLast = index === parts.length - 1;
                    const currentPath = '/' + parts.slice(0, index + 1).join('/');

                    current.children[part] = {
                        name: part,
                        path: currentPath,
                        type: isLast ? 'file' : 'folder',
                        children: isLast ? undefined : {},
                    };
                }
                current = current.children[part];
            });
        });

        return root;
    }, [files]);

    const toggleFolder = (path: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedFolders((prev) => ({
            ...prev,
            [path]: !prev[path],
        }));
    };

    const getFileIcon = (fileName: string) => {
        if (fileName.endsWith('.html')) return <Globe className="h-4 w-4 text-blue-400" />;
        if (fileName.endsWith('.ts') || fileName.endsWith('.js')) return <FileCode className="h-4 w-4 text-brand-teal-dark" />;
        return <File className="h-4 w-4 text-slate-400" />;
    };

    const renderNode = (node: FileNode, depth: number = 0) => {
        const isExpanded = expandedFolders[node.path];
        const isSelected = selectedFile === node.path;
        const isEditable = editableFiles.includes(node.path);
        const hasChildren = node.type === 'folder' && node.children && Object.keys(node.children).length > 0;

        if (node.path === '') {
            // Don't render root itself, only children
            return (
                <div className="space-y-0.5">
                    {node.children && Object.values(node.children)
                        .sort((a, b) => {
                            // Folders first, then files
                            if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
                            return a.name.localeCompare(b.name);
                        })
                        .map((child) => renderNode(child, depth))}
                </div>
            );
        }

        return (
            <div key={node.path}>
                <div
                    className={cn(
                        'group flex items-center py-1.5 px-2 cursor-pointer rounded-md transition-colors',
                        isSelected
                            ? 'bg-brand-teal/20 text-brand-teal-dark'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    )}
                    style={{ paddingLeft: `${depth * 12 + 8}px` }}
                    onClick={() => node.type === 'file' && onSelectFile(node.path)}
                >
                    {node.type === 'folder' ? (
                        <div
                            className="mr-1.5 flex items-center"
                            onClick={(e) => toggleFolder(node.path, e)}
                        >
                            {isExpanded ? (
                                <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                                <ChevronRight className="h-3.5 w-3.5" />
                            )}
                        </div>
                    ) : (
                        <div className="w-5" /> // Spacer for file icons to align with folder icons
                    )}

                    <div className="mr-2 shrink-0">
                        {node.type === 'folder' ? (
                            isExpanded ? (
                                <FolderOpen className="h-4 w-4 text-amber-400 fill-amber-400/20" />
                            ) : (
                                <Folder className="h-4 w-4 text-amber-400 fill-amber-400/20" />
                            )
                        ) : (
                            getFileIcon(node.name)
                        )}
                    </div>

                    <span
                        className={cn(
                            "text-xs font-medium truncate flex-1 min-w-0",
                            isSelected ? "font-bold" : ""
                        )}
                        title={node.name}
                    >
                        {node.name}
                    </span>

                    {node.type === 'file' && (
                        <div className="ml-auto pl-2 flex items-center gap-1 opacity-60 group-hover:opacity-100">
                            {isEditable ? (
                                <Edit3 className="h-3 w-3 text-brand-teal" />
                            ) : (
                                <Lock className="h-3 w-3 text-slate-400" />
                            )}
                        </div>
                    )}
                </div>

                {node.type === 'folder' && isExpanded && node.children && (
                    <div className="mt-0.5">
                        {Object.values(node.children)
                            .sort((a, b) => {
                                if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
                                return a.name.localeCompare(b.name);
                            })
                            .map((child) => renderNode(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={cn("flex flex-col h-full bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800", className)}>
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Explorer
                </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
                {renderNode(fileTree)}
            </div>
        </div>
    );
}

export default FileExplorer;
