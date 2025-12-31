import React, { useState, useRef, useEffect } from 'react';

interface TagAutocompleteTextareaProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    availableTags: { tag: string; label: string; count: number }[];
}

const TagAutocompleteTextarea: React.FC<TagAutocompleteTextareaProps> = ({
    value,
    onChange,
    placeholder,
    className,
    availableTags
}) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
    const [filteredTags, setFilteredTags] = useState<{ tag: string; label: string }[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const highlightRef = useRef<HTMLDivElement>(null);

    // Sync scroll between textarea and highlight layer
    useEffect(() => {
        const textarea = textareaRef.current;
        const highlight = highlightRef.current;
        if (!textarea || !highlight) return;

        const syncScroll = () => {
            highlight.scrollTop = textarea.scrollTop;
            highlight.scrollLeft = textarea.scrollLeft;
        };

        textarea.addEventListener('scroll', syncScroll);
        return () => textarea.removeEventListener('scroll', syncScroll);
    }, []);

    // Generate all available tag options
    const getAllTags = () => {
        const tags: { tag: string; label: string }[] = [];

        availableTags.forEach(item => {
            for (let i = 1; i <= item.count; i++) {
                tags.push({
                    tag: `@${item.tag}${i}`,
                    label: `${item.label} #${i}`
                });
            }
        });

        return tags;
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        const cursorPosition = e.target.selectionStart;

        onChange(newValue);

        // Check if user is typing a tag
        const textBeforeCursor = newValue.substring(0, cursorPosition);
        const atMatch = textBeforeCursor.match(/@(\w*)$/);

        if (atMatch) {
            const search = atMatch[1].toLowerCase();

            const allTags = getAllTags();
            const filtered = allTags.filter(t =>
                t.tag.toLowerCase().includes(`@${search}`) ||
                t.label.toLowerCase().includes(search)
            );

            setFilteredTags(filtered);
            setSelectedIndex(0);

            if (filtered.length > 0) {
                const textarea = textareaRef.current;
                if (textarea) {
                    const lineHeight = 20;
                    const lines = textBeforeCursor.split('\n');
                    const currentLineIndex = lines.length - 1;

                    setDropdownPosition({
                        top: (currentLineIndex + 1) * lineHeight + 45,
                        left: 10
                    });
                }
                setShowDropdown(true);
            } else {
                setShowDropdown(false);
            }
        } else {
            setShowDropdown(false);
        }
    };

    const insertTag = (tag: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const cursorPosition = textarea.selectionStart;
        const textBeforeCursor = value.substring(0, cursorPosition);
        const textAfterCursor = value.substring(cursorPosition);

        const atMatch = textBeforeCursor.match(/@(\w*)$/);
        if (atMatch) {
            const startIndex = textBeforeCursor.lastIndexOf('@');
            const newValue = textBeforeCursor.substring(0, startIndex) + tag + ' ' + textAfterCursor;
            onChange(newValue);

            setTimeout(() => {
                const newPosition = startIndex + tag.length + 1;
                textarea.setSelectionRange(newPosition, newPosition);
                textarea.focus();
            }, 0);
        }

        setShowDropdown(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (!showDropdown) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, filteredTags.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && filteredTags.length > 0) {
            e.preventDefault();
            insertTag(filteredTags[selectedIndex].tag);
        } else if (e.key === 'Escape') {
            setShowDropdown(false);
        }
    };

    useEffect(() => {
        const handleClickOutside = () => setShowDropdown(false);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Render highlighted text - replaces tags with colored spans
    const getHighlightedHtml = () => {
        if (!value) return '';

        // Escape HTML and replace tags with colored spans
        const escaped = value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // Replace tags with colored versions
        const highlighted = escaped.replace(
            /@(img|ref|asset)\d+/gi,
            '<span class="text-accent font-semibold">$&</span>'
        );

        // Replace newlines with <br> to match textarea behavior
        return highlighted.replace(/\n/g, '<br>') + '<br>';
    };

    return (
        <div className="relative">
            {/* Highlight layer - shows colored text */}
            <div
                ref={highlightRef}
                className="absolute inset-0 p-3 text-sm pointer-events-none whitespace-pre-wrap break-words overflow-hidden text-white"
                style={{ lineHeight: '1.5', fontFamily: 'inherit' }}
                aria-hidden="true"
                dangerouslySetInnerHTML={{ __html: getHighlightedHtml() }}
            />

            {/* Actual textarea - transparent text */}
            <textarea
                ref={textareaRef}
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className={`${className} relative z-10`}
                style={{
                    color: 'transparent',
                    caretColor: '#03BC89',
                    background: 'transparent',
                    WebkitTextFillColor: 'transparent'
                }}
                spellCheck={false}
                onClick={(e) => e.stopPropagation()}
            />

            {/* Autocomplete Dropdown */}
            {showDropdown && filteredTags.length > 0 && (
                <div
                    className="absolute z-50 bg-app-dark border border-gray-700 rounded-lg shadow-xl overflow-hidden min-w-[200px]"
                    style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="px-3 py-2 border-b border-gray-700 text-xs text-gray-400 uppercase tracking-wider">
                        Tags Disponíveis
                    </div>
                    {filteredTags.slice(0, 6).map((item, index) => (
                        <button
                            key={item.tag}
                            onClick={() => insertTag(item.tag)}
                            className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${index === selectedIndex
                                    ? 'bg-accent/20 text-accent'
                                    : 'text-white hover:bg-white/5'
                                }`}
                        >
                            <span className="bg-accent text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                {item.tag}
                            </span>
                            <span className="text-gray-400">{item.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TagAutocompleteTextarea;
