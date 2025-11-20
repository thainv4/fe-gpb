'use client';

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import Placeholder from '@tiptap/extension-placeholder'
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    List,
    ListOrdered,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    Heading1,
    Heading2,
    Heading3
} from 'lucide-react'

interface RichTextEditorProps {
    value?: string
    onChange?: (html: string) => void
    placeholder?: string
    minHeight?: string
}

export default function RichTextEditor({
    value = '',
    onChange,
    placeholder = 'Nhập nội dung...',
    minHeight = '150px'
}: RichTextEditorProps) {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            Underline,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            TextStyle,
            Color,
            Placeholder.configure({
                placeholder,
            }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange?.(editor.getHTML())
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none focus:outline-none px-3 py-2',
                style: `min-height: ${minHeight}`,
            },
        },
    })

    if (!editor) {
        return null
    }

    return (
        <div className="border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50 flex-wrap">
                {/* Bold */}
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`p-2 rounded hover:bg-gray-200 ${
                        editor.isActive('bold') ? 'bg-gray-300' : ''
                    }`}
                    title="Bold (Ctrl+B)"
                >
                    <Bold className="h-4 w-4" />
                </button>

                {/* Italic */}
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`p-2 rounded hover:bg-gray-200 ${
                        editor.isActive('italic') ? 'bg-gray-300' : ''
                    }`}
                    title="Italic (Ctrl+I)"
                >
                    <Italic className="h-4 w-4" />
                </button>

                {/* Underline */}
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className={`p-2 rounded hover:bg-gray-200 ${
                        editor.isActive('underline') ? 'bg-gray-300' : ''
                    }`}
                    title="Underline (Ctrl+U)"
                >
                    <UnderlineIcon className="h-4 w-4" />
                </button>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                {/* Heading 1 */}
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={`p-2 rounded hover:bg-gray-200 ${
                        editor.isActive('heading', { level: 1 }) ? 'bg-gray-300' : ''
                    }`}
                    title="Heading 1"
                >
                    <Heading1 className="h-4 w-4" />
                </button>

                {/* Heading 2 */}
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`p-2 rounded hover:bg-gray-200 ${
                        editor.isActive('heading', { level: 2 }) ? 'bg-gray-300' : ''
                    }`}
                    title="Heading 2"
                >
                    <Heading2 className="h-4 w-4" />
                </button>

                {/* Heading 3 */}
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={`p-2 rounded hover:bg-gray-200 ${
                        editor.isActive('heading', { level: 3 }) ? 'bg-gray-300' : ''
                    }`}
                    title="Heading 3"
                >
                    <Heading3 className="h-4 w-4" />
                </button>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                {/* Bullet List */}
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`p-2 rounded hover:bg-gray-200 ${
                        editor.isActive('bulletList') ? 'bg-gray-300' : ''
                    }`}
                    title="Bullet List"
                >
                    <List className="h-4 w-4" />
                </button>

                {/* Ordered List */}
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`p-2 rounded hover:bg-gray-200 ${
                        editor.isActive('orderedList') ? 'bg-gray-300' : ''
                    }`}
                    title="Numbered List"
                >
                    <ListOrdered className="h-4 w-4" />
                </button>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                {/* Align Left */}
                <button
                    type="button"
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    className={`p-2 rounded hover:bg-gray-200 ${
                        editor.isActive({ textAlign: 'left' }) ? 'bg-gray-300' : ''
                    }`}
                    title="Align Left"
                >
                    <AlignLeft className="h-4 w-4" />
                </button>

                {/* Align Center */}
                <button
                    type="button"
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    className={`p-2 rounded hover:bg-gray-200 ${
                        editor.isActive({ textAlign: 'center' }) ? 'bg-gray-300' : ''
                    }`}
                    title="Align Center"
                >
                    <AlignCenter className="h-4 w-4" />
                </button>

                {/* Align Right */}
                <button
                    type="button"
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    className={`p-2 rounded hover:bg-gray-200 ${
                        editor.isActive({ textAlign: 'right' }) ? 'bg-gray-300' : ''
                    }`}
                    title="Align Right"
                >
                    <AlignRight className="h-4 w-4" />
                </button>

                {/* Align Justify */}
                <button
                    type="button"
                    onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                    className={`p-2 rounded hover:bg-gray-200 ${
                        editor.isActive({ textAlign: 'justify' }) ? 'bg-gray-300' : ''
                    }`}
                    title="Align Justify"
                >
                    <AlignJustify className="h-4 w-4" />
                </button>
            </div>

            {/* Editor Content */}
            <EditorContent
                editor={editor}
                className="text-sm"
                style={{ minHeight }}
            />
        </div>
    )
}

