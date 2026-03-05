import { toPng, toSvg } from 'html-to-image';
import { getNodesBounds, getViewportForBounds } from '@xyflow/react';
import type { Node } from '@xyflow/react';

type ImageFormat = 'png' | 'jpeg' | 'svg';

interface DownloadImageOptions {
    nodes: Node[];
    format: ImageFormat;
    backgroundColor?: string;
    diagramName?: string;
    isTransparent?: boolean;
}

/**
 * Downloads the current React Flow canvas as an image.
 * Uses getViewportForBounds and targets .react-flow__viewport
 * to force html-to-image to capture the exact node bounding box.
 */
export async function downloadImage({
    nodes,
    format,
    backgroundColor = '#0B0D17', // Match our dark theme background
    diagramName = 'schemaflow-diagram',
    isTransparent = false,
}: DownloadImageOptions) {
    if (nodes.length === 0) {
        throw new Error('No nodes to export');
    }



    // 1. Calculate the raw bounding box of all nodes
    const nodesBounds = getNodesBounds(nodes);

    // 2. Expand the bounding box to include actual rendered SVGs (Edges)
    // React Flow's `getNodesBounds` ONLY calculates the squares of the Nodes themselves.
    // However, SVG curves (like self-referencing bezier loops) can physically extend 
    // far beyond the node boxes, causing them to clip off the exported image.
    let minX = nodesBounds.x;
    let minY = nodesBounds.y;
    let maxX = nodesBounds.x + nodesBounds.width;
    let maxY = nodesBounds.y + nodesBounds.height;

    // We must query the DOM to find the actual physical bounds of the rendered SVG paths
    // because React Flow doesn't expose mathematical bezier bounds natively.
    const edgePaths = document.querySelectorAll('.react-flow__edge-path');
    edgePaths.forEach((path) => {
        const svgPath = path as SVGGraphicsElement;
        // getBBox returns the element's bounding box in the current SVG coordinate system
        // These coordinates are relative to the React Flow viewport plane
        try {
            const bbox = svgPath.getBBox();
            if (bbox.x < minX) minX = bbox.x;
            if (bbox.y < minY) minY = bbox.y;
            if (bbox.x + bbox.width > maxX) maxX = bbox.x + bbox.width;
            if (bbox.y + bbox.height > maxY) maxY = bbox.y + bbox.height;
        } catch (e) {
            // getBBox can fail if the element is not rendered or display:none
            console.warn('Failed to calculate edge bounds', e);
        }
    });

    const finalWidth = maxX - minX;
    const finalHeight = maxY - minY;

    // Update the bounds object to reflect the edge-inclusive dimensions
    const expandedBounds = {
        x: minX,
        y: minY,
        width: finalWidth,
        height: finalHeight
    };

    const padding = 50; // Add padding around the nodes and edges

    const imageWidth = expandedBounds.width + padding * 2;
    const imageHeight = expandedBounds.height + padding * 2;

    const viewport = getViewportForBounds(
        expandedBounds,
        imageWidth,
        imageHeight,
        0.5, // min zoom
        2,   // max zoom
        0    // no internal padding
    );

    const viewportElement = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!viewportElement) {
        throw new Error('Could not find .react-flow__viewport element.');
    }

    const options = {
        backgroundColor: isTransparent ? undefined : backgroundColor,
        width: imageWidth,
        height: imageHeight,
        style: {
            width: `${imageWidth}px`,
            height: `${imageHeight}px`,
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`
        },
        filter: (node: HTMLElement) => {
            // Exclude UI controls if somehow included in viewport
            if (node?.classList?.contains('react-flow__minimap')) return false;
            if (node?.classList?.contains('react-flow__controls')) return false;
            if (node?.classList?.contains('react-flow__panel')) return false;
            return true;
        }
    };

    try {
        let dataUrl = '';
        if (format === 'png') {
            dataUrl = await toPng(viewportElement, options);
        } else if (format === 'jpeg') {
            // Because html-to-image native jpeg can have issues with transparency/backgrounds,
            // we will render the JPEG using the official toPng method and drawing to canvas
            const pngDataUrl = await toPng(viewportElement, options);
            const img = new Image();
            img.src = pngDataUrl;
            await new Promise(r => img.onload = r);
            const cvs = document.createElement('canvas');
            cvs.width = imageWidth;
            cvs.height = imageHeight;
            const ctx = cvs.getContext('2d');
            if (ctx) {
                ctx.fillStyle = backgroundColor;
                ctx.fillRect(0, 0, imageWidth, imageHeight);
                ctx.drawImage(img, 0, 0);
                dataUrl = cvs.toDataURL('image/jpeg', 0.95);
            }
        } else if (format === 'svg') {
            dataUrl = await toSvg(viewportElement, options);
        }

        const link = document.createElement('a');
        link.download = `${diagramName}.${format}`;
        link.href = dataUrl;
        link.click();

    } catch (err) {
        console.error('Failed to generate image:', err);
        throw new Error(`Failed to generate ${format.toUpperCase()}`);
    }
}
