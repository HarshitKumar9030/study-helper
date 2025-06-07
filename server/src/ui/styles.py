"""
Modern styling for PyQt5 application.
"""

# Dark theme color palette
DARK_COLORS = {
    'primary': '#3B82F6',      # Blue
    'primary_hover': '#2563EB',
    'secondary': '#6B7280',    # Gray
    'success': '#10B981',      # Green
    'warning': '#F59E0B',      # Amber
    'error': '#EF4444',        # Red
    'background': '#111827',   # Dark background
    'surface': '#1F2937',      # Card background
    'surface_hover': '#374151',
    'text_primary': '#F9FAFB', # Light text
    'text_secondary': '#D1D5DB',
    'border': '#374151',
    'border_light': '#4B5563'
}

# Light theme color palette
LIGHT_COLORS = {
    'primary': '#3B82F6',
    'primary_hover': '#2563EB',
    'secondary': '#6B7280',
    'success': '#10B981',
    'warning': '#F59E0B',
    'error': '#EF4444',
    'background': '#F9FAFB',
    'surface': '#FFFFFF',
    'surface_hover': '#F3F4F6',
    'text_primary': '#111827',
    'text_secondary': '#4B5563',
    'border': '#E5E7EB',
    'border_light': '#F3F4F6'
}

def get_main_window_style(theme='dark'):
    """Get main window stylesheet."""
    colors = DARK_COLORS if theme == 'dark' else LIGHT_COLORS
    
    return f"""
    QMainWindow {{
        background-color: {colors['background']};
        color: {colors['text_primary']};
    }}
    
    QWidget {{
        background-color: transparent;
        color: {colors['text_primary']};
        font-family: 'Segoe UI', Arial, sans-serif;
    }}
    
    /* Sidebar */
    QFrame#sidebar {{
        background-color: {colors['surface']};
        border-right: 1px solid {colors['border']};
    }}
    
    /* Content area */
    QFrame#content {{
        background-color: {colors['background']};
    }}
    
    /* Cards */
    QFrame.card {{
        background-color: {colors['surface']};
        border: 1px solid {colors['border']};
        border-radius: 12px;
        padding: 16px;
    }}
    
    QFrame.card:hover {{
        background-color: {colors['surface_hover']};
        border-color: {colors['border_light']};
    }}
    """

def get_button_style(theme='dark', variant='primary'):
    """Get button stylesheet."""
    colors = DARK_COLORS if theme == 'dark' else LIGHT_COLORS
    
    if variant == 'primary':
        bg_color = colors['primary']
        hover_color = colors['primary_hover']
        text_color = '#FFFFFF'
    elif variant == 'secondary':
        bg_color = colors['surface']
        hover_color = colors['surface_hover']
        text_color = colors['text_primary']
    elif variant == 'success':
        bg_color = colors['success']
        hover_color = '#059669'
        text_color = '#FFFFFF'
    elif variant == 'warning':
        bg_color = colors['warning']
        hover_color = '#D97706'
        text_color = '#FFFFFF'
    else:  # error
        bg_color = colors['error']
        hover_color = '#DC2626'
        text_color = '#FFFFFF'
    
    return f"""
    QPushButton {{
        background-color: {bg_color};
        color: {text_color};
        border: none;
        border-radius: 8px;
        padding: 12px 24px;
        font-size: 14px;
        font-weight: 500;
        min-height: 20px;
    }}
    
    QPushButton:hover {{
        background-color: {hover_color};
    }}
    
    QPushButton:pressed {{
        background-color: {hover_color};
        transform: translateY(1px);
    }}
    
    QPushButton:disabled {{
        background-color: {colors['secondary']};
        color: {colors['text_secondary']};
    }}
    """

def get_sidebar_button_style(theme='dark'):
    """Get sidebar button stylesheet."""
    colors = DARK_COLORS if theme == 'dark' else LIGHT_COLORS
    
    return f"""
    QPushButton {{
        background-color: transparent;
        color: {colors['text_secondary']};
        border: none;
        border-radius: 8px;
        padding: 12px 16px;
        text-align: left;
        font-size: 14px;
        font-weight: 400;
        min-height: 20px;
    }}
    
    QPushButton:hover {{
        background-color: {colors['surface_hover']};
        color: {colors['text_primary']};
    }}
    
    QPushButton:checked {{
        background-color: {colors['primary']};
        color: #FFFFFF;
    }}
    
    QPushButton:checked:hover {{
        background-color: {colors['primary_hover']};
    }}
    """

def get_input_style(theme='dark'):
    """Get input field stylesheet."""
    colors = DARK_COLORS if theme == 'dark' else LIGHT_COLORS
    
    return f"""
    QLineEdit, QTextEdit, QPlainTextEdit {{
        background-color: {colors['surface']};
        color: {colors['text_primary']};
        border: 1px solid {colors['border']};
        border-radius: 8px;
        padding: 12px;
        font-size: 14px;
        selection-background-color: {colors['primary']};
    }}
    
    QLineEdit:focus, QTextEdit:focus, QPlainTextEdit:focus {{
        border-color: {colors['primary']};
        outline: none;
    }}
    
    QLineEdit:disabled, QTextEdit:disabled, QPlainTextEdit:disabled {{
        background-color: {colors['border']};
        color: {colors['text_secondary']};
    }}
    """

def get_label_style(theme='dark', variant='primary'):
    """Get label stylesheet."""
    colors = DARK_COLORS if theme == 'dark' else LIGHT_COLORS
    
    if variant == 'primary':
        color = colors['text_primary']
        font_weight = '500'
    elif variant == 'secondary':
        color = colors['text_secondary']
        font_weight = '400'
    elif variant == 'heading':
        color = colors['text_primary']
        font_weight = '600'
    else:
        color = colors['text_primary']
        font_weight = '400'
    
    return f"""
    QLabel {{
        color: {color};
        font-weight: {font_weight};
        background-color: transparent;
    }}
    """

def get_scroll_style(theme='dark'):
    """Get scroll area stylesheet."""
    colors = DARK_COLORS if theme == 'dark' else LIGHT_COLORS
    
    return f"""
    QScrollArea {{
        border: none;
        background-color: transparent;
    }}
    
    QScrollBar:vertical {{
        background-color: {colors['surface']};
        width: 12px;
        border-radius: 6px;
        margin: 0;
    }}
    
    QScrollBar::handle:vertical {{
        background-color: {colors['border_light']};
        border-radius: 6px;
        min-height: 20px;
    }}
    
    QScrollBar::handle:vertical:hover {{
        background-color: {colors['secondary']};
    }}
    
    QScrollBar::add-line:vertical,
    QScrollBar::sub-line:vertical {{
        height: 0;
    }}
    
    QScrollBar:horizontal {{
        background-color: {colors['surface']};
        height: 12px;
        border-radius: 6px;
        margin: 0;
    }}
    
    QScrollBar::handle:horizontal {{
        background-color: {colors['border_light']};
        border-radius: 6px;
        min-width: 20px;
    }}
    
    QScrollBar::handle:horizontal:hover {{
        background-color: {colors['secondary']};
    }}
    
    QScrollBar::add-line:horizontal,
    QScrollBar::sub-line:horizontal {{
        width: 0;
    }}
    """

def get_list_style(theme='dark'):
    """Get list widget stylesheet."""
    colors = DARK_COLORS if theme == 'dark' else LIGHT_COLORS
    
    return f"""
    QListWidget {{
        background-color: {colors['surface']};
        border: 1px solid {colors['border']};
        border-radius: 8px;
        padding: 8px;
        outline: none;
    }}
    
    QListWidget::item {{
        background-color: transparent;
        color: {colors['text_primary']};
        padding: 8px 12px;
        border-radius: 6px;
        margin: 2px 0;
    }}
    
    QListWidget::item:hover {{
        background-color: {colors['surface_hover']};
    }}
    
    QListWidget::item:selected {{
        background-color: {colors['primary']};
        color: #FFFFFF;
    }}
    """
