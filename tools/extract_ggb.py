import zipfile
import xml.etree.ElementTree as ET
import sys
import os
import math
import argparse

def parse_color(color_elem):
    if color_elem is None:
        return (0, 0, 0)
    r = int(color_elem.get('r', 0))
    g = int(color_elem.get('g', 0))
    b = int(color_elem.get('b', 0))
    return (r, g, b)

def get_label_pos(offset_x, offset_y):
    try:
        ox = float(offset_x)
        oy = float(offset_y)
    except (ValueError, TypeError):
        return 'above right'
        
    # In GeoGebra:
    # ox: positive is right, negative is left
    # oy: positive is down, negative is up (screen coordinate offset)
    if ox > 5 and oy < -5:
        return 'above right'
    elif ox > 5 and oy > 5:
        return 'below right'
    elif ox < -5 and oy < -5:
        return 'above left'
    elif ox < -5 and oy > 5:
        return 'below left'
    elif abs(ox) <= 5 and oy < -5:
        return 'above'
    elif abs(ox) <= 5 and oy > 5:
        return 'below'
    elif ox > 5 and abs(oy) <= 5:
        return 'right'
    elif ox < -5 and abs(oy) <= 5:
        return 'left'
    return 'above right'

def map_line_style(style_type):
    # GeoGebra line types: 0=solid, 1=dashed, 2=dotted, 3=dash-dotted
    try:
        t = int(style_type)
    except (ValueError, TypeError):
        return ''
    if t == 1:
        return 'dashed'
    elif t == 2:
        return 'dotted'
    elif t == 3:
        return 'dash dot'
    elif t == 4:
        return 'dash dot dot'
    return ''

def main():
    parser = argparse.ArgumentParser(description="Offline GeoGebra (.ggb) to TikZ Extractor")
    parser.add_argument("file", nargs="?", help="Path to the .ggb file to extract")
    parser.add_argument("-o", "--output", help="Output file path (default: print to console)")
    parser.add_argument("-m", "--mode", choices=["standard", "autofit"], default="standard", 
                        help="Extraction mode: 'standard' (no clipping) or 'autofit' (bounded box)")
    
    args = parser.parse_args()
    
    # If no file is provided, search the current directory for .ggb files
    ggb_file = args.file
    if not ggb_file:
        ggb_files = [f for f in os.listdir('.') if f.endswith('.ggb')]
        if len(ggb_files) == 1:
            ggb_file = ggb_files[0]
            print(f"[*] No file specified. Found single .ggb file: {ggb_file}", file=sys.stderr)
        elif len(ggb_files) > 1:
            print("Multiple .ggb files found in current directory. Please choose one:", file=sys.stderr)
            for idx, f in enumerate(ggb_files):
                print(f"  {idx + 1}. {f}", file=sys.stderr)
            try:
                choice = int(input("Enter number (1-%d): " % len(ggb_files)))
                ggb_file = ggb_files[choice - 1]
            except Exception:
                print("Invalid choice. Exiting.", file=sys.stderr)
                sys.exit(1)
        else:
            parser.print_help()
            sys.exit(1)
            
    if not os.path.exists(ggb_file):
        print(f"[-] Error: File not found: {ggb_file}", file=sys.stderr)
        sys.exit(1)
        
    print(f"[*] Parsing {ggb_file}...", file=sys.stderr)
    
    try:
        with zipfile.ZipFile(ggb_file, 'r') as z:
            xml_content = z.read('geogebra.xml')
    except Exception as e:
        print(f"[-] Error: Could not read .ggb file as zip: {e}", file=sys.stderr)
        sys.exit(1)
        
    try:
        root = ET.fromstring(xml_content)
    except Exception as e:
        print(f"[-] Error: Could not parse geogebra.xml: {e}", file=sys.stderr)
        sys.exit(1)
        
    # 1. Parse numeric variables
    numerics = {}
    for elem in root.findall('.//element[@type="numeric"]'):
        label = elem.get('label')
        val_elem = elem.find('value')
        if label and val_elem is not None:
            try:
                numerics[label] = float(val_elem.get('val', 0))
            except ValueError:
                pass
                
    # 2. Parse points
    points = {}
    for elem in root.findall('.//element[@type="point"]'):
        label = elem.get('label')
        coords = elem.find('coords')
        if label and coords is not None:
            try:
                x = float(coords.get('x', 0))
                y = float(coords.get('y', 0))
                z = float(coords.get('z', 1))
                if z != 0:
                    x /= z
                    y /= z
                else:
                    x = 0.0
                    y = 0.0
                
                # Visual properties
                color = parse_color(elem.find('objColor'))
                
                show_elem = elem.find('show')
                visible = show_elem.get('object', 'true') == 'true' if show_elem is not None else True
                label_visible = show_elem.get('label', 'true') == 'true' if show_elem is not None else True
                
                offset_elem = elem.find('labelOffset')
                if offset_elem is not None:
                    label_pos = get_label_pos(offset_elem.get('x', 0), offset_elem.get('y', 0))
                else:
                    label_pos = 'above right'
                    
                pt_size_elem = elem.find('pointSize')
                pt_size = int(pt_size_elem.get('val', 5)) if pt_size_elem is not None else 5
                
                points[label] = {
                    'x': x, 'y': y,
                    'color': color,
                    'visible': visible,
                    'label_visible': label_visible,
                    'label_pos': label_pos,
                    'pt_size': pt_size
                }
            except Exception as ex:
                print(f"[!] Warning: Failed to parse point {label}: {ex}", file=sys.stderr)

    # 3. Parse segments, lines, rays, vectors, polygons, circles, angles
    # We will gather command information as well
    commands = {}
    for cmd in root.findall('.//command'):
        name = cmd.get('name')
        inputs = cmd.find('input')
        outputs = cmd.find('output')
        if name and inputs is not None and outputs is not None:
            out_label = outputs.get('a0')
            in_args = []
            idx = 0
            while True:
                arg = inputs.get(f'a{idx}')
                if arg is None:
                    break
                in_args.append(arg)
                idx += 1
            commands[out_label] = {'name': name, 'args': in_args}

    elements = {}
    for elem in root.findall('.//element'):
        label = elem.get('label')
        el_type = elem.get('type')
        if label and el_type:
            show_elem = elem.find('show')
            visible = show_elem.get('object', 'true') == 'true' if show_elem is not None else True
            color = parse_color(elem.find('objColor'))
            style_elem = elem.find('lineStyle')
            thickness = int(style_elem.get('thickness', 5)) if style_elem is not None else 5
            style_type = style_elem.get('type', '0') if style_elem is not None else '0'
            style = map_line_style(style_type)
            
            elements[label] = {
                'type': el_type,
                'visible': visible,
                'color': color,
                'thickness': thickness,
                'style': style,
                'elem': elem
            }

    # Generate TikZ
    tikz_lines = []
    tikz_lines.append("% ===========================================")
    tikz_lines.append(f"% Extracted from {os.path.basename(ggb_file)} (Offline)")
    tikz_lines.append("% ===========================================")
    tikz_lines.append("")
    
    # 4. Color Definitions
    colors_used = set()
    # Add point colors
    for pt in points.values():
        if pt['color'] != (0, 0, 0):
            colors_used.add(pt['color'])
    # Add element colors
    for el in elements.values():
        if el['color'] != (0, 0, 0):
            colors_used.add(el['color'])
            
    color_map = {}
    if colors_used:
        tikz_lines.append("% --- Color Definitions ---")
        for idx, rgb in enumerate(sorted(colors_used)):
            col_name = f"ggbcolor{idx}"
            color_map[rgb] = col_name
            tikz_lines.append(f"\\definecolor{{{col_name}}}{{RGB}}{{{rgb[0]}, {rgb[1]}, {rgb[2]}}}")
        tikz_lines.append("")

    # Find Bounding Box
    if points:
        xs = [pt['x'] for pt in points.values()]
        ys = [pt['y'] for pt in points.values()]
        min_x, max_x = min(xs), max(xs)
        min_y, max_y = min(ys), max(ys)
        
        # Add padding
        pad = 1.0
        min_x -= pad
        max_x += pad
        min_y -= pad
        max_y += pad
    else:
        min_x, max_x, min_y, max_y = -5.0, 5.0, -5.0, 5.0

    tikz_lines.append("\\begin{tikzpicture}[scale=1.0, line cap=round, line join=round]")
    
    if args.mode == "autofit":
        tikz_lines.append(f"  \\clip ({min_x:.3f}, {min_y:.3f}) rectangle ({max_x:.3f}, {max_y:.3f});")
        tikz_lines.append(f"  \\useasboundingbox ({min_x:.3f}, {min_y:.3f}) rectangle ({max_x:.3f}, {max_y:.3f});")
        tikz_lines.append("")

    # 5. Define coordinates
    tikz_lines.append("  % --- Coordinates ---")
    for label, pt in points.items():
        tikz_lines.append(f"  \\coordinate ({label}) at ({pt['x']:.4f}, {pt['y']:.4f});")
    tikz_lines.append("")

    # Helper function for line styling
    def get_style_str(el_info):
        styles = []
        if el_info['color'] != (0, 0, 0):
            styles.append(color_map.get(el_info['color'], 'black'))
        if el_info['thickness'] != 5:
            # Scale thickness
            val = el_info['thickness'] * 0.25
            styles.append(f"line width={val:.2f}pt")
        if el_info['style']:
            styles.append(el_info['style'])
        return ", ".join(styles)

    # 6. Polygons (draw them first so they sit in the background)
    poly_lines = []
    for label, el in elements.items():
        if el['type'] == 'polygon' and el['visible']:
            cmd_info = commands.get(label)
            if cmd_info and cmd_info['name'] == 'Polygon':
                vertices = cmd_info['args']
                style_str = []
                # Fill opacity and color
                alpha_elem = el['elem'].find('objColor')
                alpha = float(alpha_elem.get('alpha', 50)) / 255.0 if alpha_elem is not None else 0.15
                
                col = color_map.get(el['color'], 'black')
                style_str.append(f"fill={col}")
                style_str.append(f"fill opacity={alpha:.2f}")
                
                # Check line style
                border_style = get_style_str(el)
                if border_style:
                    style_str.append(border_style)
                
                opt_str = f"[{', '.join(style_str)}]" if style_str else ""
                v_str = " -- ".join(f"({v})" for v in vertices)
                poly_lines.append(f"  \\draw{opt_str} {v_str} -- cycle;")
                
    if poly_lines:
        tikz_lines.append("  % --- Polygons ---")
        tikz_lines.extend(poly_lines)
        tikz_lines.append("")

    # 7. Segments, Lines, Rays, Vectors, Circles, Angles
    shapes_lines = []
    for label, el in elements.items():
        if not el['visible'] or el['type'] == 'polygon':
            continue
            
        style_str = get_style_str(el)
        opt_str = f"[{style_str}]" if style_str else ""
        
        # Segment
        if el['type'] == 'segment':
            # Check element attributes first
            start_elem = el['elem'].find('startPoint')
            end_elem = el['elem'].find('endPoint')
            if start_elem is not None and end_elem is not None:
                p1 = start_elem.get('exp')
                p2 = end_elem.get('exp')
                shapes_lines.append(f"  \\draw{opt_str} ({p1}) -- ({p2});")
            else:
                # Fallback to command
                cmd_info = commands.get(label)
                if cmd_info and len(cmd_info['args']) >= 2:
                    p1, p2 = cmd_info['args'][0], cmd_info['args'][1]
                    shapes_lines.append(f"  \\draw{opt_str} ({p1}) -- ({p2});")
                    
        # Line
        elif el['type'] == 'line':
            cmd_info = commands.get(label)
            if cmd_info and len(cmd_info['args']) >= 2:
                p1, p2 = cmd_info['args'][0], cmd_info['args'][1]
                # Extrapolate to draw long line using calc library
                shapes_lines.append(f"  \\draw{opt_str} ($({p1})! -3 !({p2})$) -- ($({p2})! -3 !({p1})$);")
                
        # Ray
        elif el['type'] == 'ray':
            cmd_info = commands.get(label)
            if cmd_info and len(cmd_info['args']) >= 2:
                p1, p2 = cmd_info['args'][0], cmd_info['args'][1]
                shapes_lines.append(f"  \\draw{opt_str} ({p1}) -- ($({p1})! 4 !({p2})$);")
                
        # Vector
        elif el['type'] == 'vector':
            # Add arrow to vector
            vec_styles = []
            if style_str:
                vec_styles.append(style_str)
            vec_styles.append("->")
            vec_opt = f"[{', '.join(vec_styles)}]"
            
            cmd_info = commands.get(label)
            if cmd_info and len(cmd_info['args']) >= 2:
                p1, p2 = cmd_info['args'][0], cmd_info['args'][1]
                shapes_lines.append(f"  \\draw{vec_opt} ({p1}) -- ({p2});")
            else:
                # Vector from origin or relative components
                coords = el['elem'].find('coords')
                if coords is not None:
                    try:
                        vx = float(coords.get('x', 0))
                        vy = float(coords.get('y', 0))
                        shapes_lines.append(f"  \\draw{vec_opt} (0,0) -- ({vx:.4f},{vy:.4f});")
                    except ValueError:
                        pass
                        
        # Circle
        elif el['type'] == 'circle':
            cmd_info = commands.get(label)
            if cmd_info and len(cmd_info['args']) >= 2:
                center = cmd_info['args'][0]
                arg1 = cmd_info['args'][1]
                
                # Check if arg1 is a point
                if arg1 in points:
                    pt_c = points[center]
                    pt_r = points[arg1]
                    r = math.hypot(pt_r['x'] - pt_c['x'], pt_r['y'] - pt_c['y'])
                    shapes_lines.append(f"  \\draw{opt_str} ({center}) circle ({r:.4f});")
                else:
                    # Check if arg1 is numeric variable or float
                    r_val = numerics.get(arg1, None)
                    if r_val is None:
                        try:
                            r_val = float(arg1)
                        except ValueError:
                            r_val = 2.0 # default fallback
                    shapes_lines.append(f"  \\draw{opt_str} ({center}) circle ({r_val:.4f});")
            else:
                # Fallback to equations/coords if circle center isn't named
                pass

        # Angle
        elif el['type'] == 'angle':
            cmd_info = commands.get(label)
            if cmd_info and len(cmd_info['args']) >= 3:
                # Angle(A, B, C) where B is vertex
                a, b, c = cmd_info['args'][0], cmd_info['args'][1], cmd_info['args'][2]
                if a in points and b in points and c in points:
                    # Calculate angles
                    pt_a, pt_b, pt_c = points[a], points[b], points[c]
                    ang_a = math.atan2(pt_a['y'] - pt_b['y'], pt_a['x'] - pt_b['x'])
                    ang_c = math.atan2(pt_c['y'] - pt_b['y'], pt_c['x'] - pt_b['x'])
                    
                    deg_a = math.degrees(ang_a) % 360
                    deg_c = math.degrees(ang_c) % 360
                    
                    # Order in GeoGebra is usually counter-clockwise from A to C around B
                    # Let's write the arc
                    r_arc = 0.4
                    shapes_lines.append(f"  \\draw[color={color_map.get(el['color'], 'black')}] ({b}) +({deg_a:.1f}:{r_arc:.2f}) arc ({deg_a:.1f}:{deg_c:.1f}:{r_arc:.2f});")

    if shapes_lines:
        tikz_lines.append("  % --- Geometric Shapes ---")
        tikz_lines.extend(shapes_lines)
        tikz_lines.append("")

    # 8. Draw point dots and labels (on top of shapes)
    tikz_lines.append("  % --- Points Visuals ---")
    for label, pt in points.items():
        if pt['visible']:
            col = color_map.get(pt['color'], 'black')
            r_pt = pt['pt_size'] * 0.5 # scale down size
            tikz_lines.append(f"  \\fill[{col}] ({label}) circle ({r_pt:.2f}pt);")
            
        if pt['label_visible']:
            # Label
            tikz_lines.append(f"  \\draw ({label}) node[{pt['label_pos']}] {{$A$}};".replace("$A$", f"${label}$"))

    tikz_lines.append("\\end{tikzpicture}")
    
    # 9. Write output
    output_str = "\n".join(tikz_lines)
    
    if args.output:
        try:
            with open(args.output, 'w', encoding='utf-8') as f:
                f.write(output_str)
            print(f"[+] Successfully wrote TikZ code to {args.output}", file=sys.stderr)
        except Exception as e:
            print(f"[-] Error writing output file: {e}", file=sys.stderr)
            sys.exit(1)
    else:
        print("\n--- BEGIN TIKZ CODE ---")
        print(output_str)
        print("--- END TIKZ CODE ---\n")
        print("[*] Tip: You can save this to a file with: python extract_ggb.py -o output.tex", file=sys.stderr)

if __name__ == "__main__":
    main()
