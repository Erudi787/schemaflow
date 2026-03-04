import { toPng, toSvg } from 'html-to-image';
import { getNodesBounds, getViewportForBounds } from '@xyflow/react';
import type { Node } from '@xyflow/react';

type ImageFormat = 'png' | 'jpeg' | 'svg';

interface DownloadImageOptions {
    nodes: Node[];
    format: ImageFormat;
    backgroundColor?: string;
    diagramName?: string;
}

/**
 * Downloads the current React Flow canvas as an image.
 * Uses getViewportForBounds and temporarily resizes the DOM physically
 * to force html-to-image to capture the exact node bounding box.
 */
export async function downloadImage({
    nodes,
    format,
    backgroundColor = '#0B0D17', // Match our dark theme background
    diagramName = 'schemaflow-diagram',
}: DownloadImageOptions) {
    if (nodes.length === 0) {
        throw new Error('No nodes to export');
    }



    // 1. Calculate the raw bounding box of all nodes
    const nodesBounds = getNodesBounds(nodes);
    const padding = 50; // Add padding around the nodes

    const imageWidth = nodesBounds.width + padding * 2;
    const imageHeight = nodesBounds.height + padding * 2;

    const viewport = getViewportForBounds(
        nodesBounds,
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
        backgroundColor,
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
