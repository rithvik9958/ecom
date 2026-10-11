'use client'

/**
 * CKEditorInner – The actual CKEditor 5 component.
 * Only rendered client-side (imported via dynamic() from RichEditor.js).
 *
 * Free/open-source (GPL v2+) via the `ckeditor5` npm package.
 * Includes all free-tier plugins.
 */

import { useState, useRef } from 'react'
import { CKEditor } from '@ckeditor/ckeditor5-react'
import {
  ClassicEditor,
  Essentials,
  Autoformat,
  AutoLink,
  Bold,
  Code,
  Italic,
  Strikethrough,
  Subscript,
  Superscript,
  Underline,
  BlockQuote,
  CodeBlock,
  FindAndReplace,
  FontBackgroundColor,
  FontColor,
  FontFamily,
  FontSize,
  GeneralHtmlSupport,
  Heading,
  Highlight,
  HorizontalLine,
  HtmlComment,
  Image,
  ImageCaption,
  ImageInsert,
  ImageResize,
  ImageStyle,
  ImageToolbar,
  ImageUpload,
  SimpleUploadAdapter,
  Indent,
  IndentBlock,
  Link,
  LinkImage,
  List,
  ListProperties,
  TodoList,
  MediaEmbed,
  PageBreak,
  Paragraph,
  PasteFromOffice,
  RemoveFormat,
  SelectAll,
  ShowBlocks,
  SourceEditing,
  SpecialCharacters,
  SpecialCharactersArrows,
  SpecialCharactersCurrency,
  SpecialCharactersEssentials,
  SpecialCharactersLatin,
  SpecialCharactersMathematical,
  SpecialCharactersText,
  Table,
  TableCaption,
  TableCellProperties,
  TableColumnResize,
  TableProperties,
  TableToolbar,
  TextTransformation,
  Alignment,
  WordCount,
} from 'ckeditor5'

import 'ckeditor5/ckeditor5.css'

const editorConfig = {
  licenseKey: 'GPL',

  plugins: [
    Essentials,
    Autoformat,
    AutoLink,
    Bold,
    Code,
    Italic,
    Strikethrough,
    Subscript,
    Superscript,
    Underline,
    BlockQuote,
    CodeBlock,
    FindAndReplace,
    FontBackgroundColor,
    FontColor,
    FontFamily,
    FontSize,
    GeneralHtmlSupport,
    Heading,
    Highlight,
    HorizontalLine,
    HtmlComment,
    Image,
    ImageCaption,
    ImageInsert,
    ImageResize,
    ImageStyle,
    ImageToolbar,
    ImageUpload,
    SimpleUploadAdapter,
    Indent,
    IndentBlock,
    Link,
    LinkImage,
    List,
    ListProperties,
    TodoList,
    MediaEmbed,
    PageBreak,
    Paragraph,
    PasteFromOffice,
    RemoveFormat,
    SelectAll,
    ShowBlocks,
    SourceEditing,
    SpecialCharacters,
    SpecialCharactersArrows,
    SpecialCharactersCurrency,
    SpecialCharactersEssentials,
    SpecialCharactersLatin,
    SpecialCharactersMathematical,
    SpecialCharactersText,
    Table,
    TableCaption,
    TableCellProperties,
    TableColumnResize,
    TableProperties,
    TableToolbar,
    TextTransformation,
    Alignment,
    WordCount,
  ],

  toolbar: {
    items: [
      'undo', 'redo',
      '|',
      'sourceEditing', 'showBlocks', 'findAndReplace', 'selectAll',
      '|',
      'heading',
      '|',
      'fontSize', 'fontFamily', 'fontColor', 'fontBackgroundColor',
      '|',
      'bold', 'italic', 'underline', 'strikethrough', 'subscript', 'superscript', 'code', 'removeFormat',
      '|',
      'highlight',
      '|',
      'alignment',
      '|',
      'bulletedList', 'numberedList', 'todoList', 'outdent', 'indent',
      '|',
      'link', 'insertImage', 'insertTable', 'blockQuote', 'codeBlock',
      'horizontalLine', 'pageBreak', 'specialCharacters', 'mediaEmbed',
    ],
    shouldNotGroupWhenFull: false,
  },

  heading: {
    options: [
      { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
      { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
      { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
      { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
      { model: 'heading4', view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' },
      { model: 'heading5', view: 'h5', title: 'Heading 5', class: 'ck-heading_heading5' },
      { model: 'heading6', view: 'h6', title: 'Heading 6', class: 'ck-heading_heading6' },
    ],
  },

  image: {
    toolbar: [
      'toggleImageCaption', 'imageTextAlternative',
      '|',
      'imageStyle:inline', 'imageStyle:block', 'imageStyle:wrapText',
      '|',
      'imageResize',
      '|',
      'linkImage',
    ],
    resizeUnit: '%',
    resizeOptions: [
      { name: 'resizeImage:original', value: null,  label: 'Original' },
      { name: 'resizeImage:25',       value: '25',  label: '25%' },
      { name: 'resizeImage:50',       value: '50',  label: '50%' },
      { name: 'resizeImage:75',       value: '75',  label: '75%' },
    ],
  },

  table: {
    contentToolbar: [
      'tableColumn', 'tableRow', 'mergeTableCells',
      'tableProperties', 'tableCellProperties', 'toggleTableCaption',
    ],
  },

  list: {
    properties: {
      styles: true,
      startIndex: true,
      reversed: true,
    },
  },

  link: {
    addTargetToExternalLinks: true,
    defaultProtocol: 'https://',
    decorators: {
      openInNewTab: {
        mode: 'manual',
        label: 'Open in a new tab',
        attributes: { target: '_blank', rel: 'noopener noreferrer' },
      },
      forceDownload: {
        mode: 'automatic',
        callback: url => url && /\.(xlsx?|xlsm|xlsb|csv|pdf|docx?|zip|txt)$/i.test(url),
        attributes: {
          target: '_blank',
          download: ''
        }
      }
    },
  },

  fontSize: {
    options: [10, 11, 12, 'default', 14, 16, 18, 20, 24, 28, 32, 36, 48],
  },

  fontFamily: {
    options: [
      'default',
      'Arial, Helvetica, sans-serif',
      'Courier New, Courier, monospace',
      'Georgia, serif',
      'Lucida Sans Unicode, Lucida Grande, sans-serif',
      'Tahoma, Geneva, sans-serif',
      'Times New Roman, Times, serif',
      'Trebuchet MS, Helvetica, sans-serif',
      'Verdana, Geneva, sans-serif',
    ],
    supportAllValues: true,
  },

  highlight: {
    options: [
      { model: 'yellowMarker', class: 'marker-yellow', title: 'Yellow marker', color: '#fdfd77', type: 'marker' },
      { model: 'greenMarker',  class: 'marker-green',  title: 'Green marker',  color: '#62f962', type: 'marker' },
      { model: 'pinkMarker',   class: 'marker-pink',   title: 'Pink marker',   color: '#fc7999', type: 'marker' },
      { model: 'blueMarker',   class: 'marker-blue',   title: 'Blue marker',   color: '#72cdfd', type: 'marker' },
      { model: 'redPen',       class: 'pen-red',        title: 'Red pen',       color: '#e91313', type: 'pen'    },
      { model: 'greenPen',     class: 'pen-green',      title: 'Green pen',     color: '#128a00', type: 'pen'    },
    ],
  },

  codeBlock: {
    languages: [
      { language: 'plaintext',  label: 'Plain text'  },
      { language: 'c',          label: 'C'           },
      { language: 'cs',         label: 'C#'          },
      { language: 'cpp',        label: 'C++'         },
      { language: 'css',        label: 'CSS'         },
      { language: 'diff',       label: 'Diff'        },
      { language: 'html',       label: 'HTML'        },
      { language: 'java',       label: 'Java'        },
      { language: 'javascript', label: 'JavaScript'  },
      { language: 'php',        label: 'PHP'         },
      { language: 'python',     label: 'Python'      },
      { language: 'ruby',       label: 'Ruby'        },
      { language: 'sql',        label: 'SQL'         },
      { language: 'typescript', label: 'TypeScript'  },
      { language: 'xml',        label: 'XML'         },
    ],
  },

  htmlSupport: {
    allow: [
      { name: /.*/, attributes: true, classes: true, styles: true },
    ],
  },
  simpleUpload: {
    uploadUrl: '/api/upload',
  },
}

export default function CKEditorInner({ value = '', onChange, placeholder = 'Enter content here...', minHeight = 220 }) {
  const [editorInstance, setEditorInstance] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file || !editorInstance) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('upload', file)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()

      if (data.url) {
        editorInstance.model.change(writer => {
          const linkedText = writer.createText(`📎 ${file.name}`, { linkHref: data.url })
          editorInstance.model.insertContent(linkedText, editorInstance.model.document.selection)
        })
      } else if (data.error) {
        alert(data.error.message || 'Upload failed')
      }
    } catch (err) {
      console.error('File upload error:', err)
      alert('File upload failed')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="ckeditor5-wrapper flex flex-col gap-2" style={{ '--ck-editor-min-height': `${minHeight}px` }}>
      <div className="flex justify-end">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          style={{ display: 'none' }} 
          accept=".xlsx,.xls,.csv,.pdf,.doc,.docx,.zip,.txt"
        />
        <button 
          type="button" 
          onClick={() => fileInputRef.current?.click()}
          disabled={!editorInstance || isUploading}
          className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-sm rounded border border-border flex items-center gap-2 text-foreground/80 transition-colors disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
          {isUploading ? 'Uploading...' : 'Attach Document (Excel/PDF)'}
        </button>
      </div>
      <CKEditor
        editor={ClassicEditor}
        onReady={editor => setEditorInstance(editor)}
        config={{
          ...editorConfig,
          placeholder,
        }}
        data={value}
        onChange={(event, editor) => {
          const data = editor.getData()
          onChange && onChange(data)
        }}
      />
    </div>
  )
}
