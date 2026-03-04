import { toPng, toJpeg, toSvg } from 'html-to-image';
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
 * Requires the '.react-flow__viewport' DOM element to be present.
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

    // Attempt to locate the specific viewport div React Flow uses to render nodes
    const viewportElement = document.querySelector('.react-flow__viewport') as HTMLElement;

    if (!viewportElement) {
        throw new Error('Could not find React Flow viewport element');
    }

    // 1. Calculate the bounding box of all nodes
    const nodesBounds = getNodesBounds(nodes);

    // Add some padding around the edges of the image
    const padding = 50;

    // 2. Determine what the viewport should be to fit all nodes perfectly
    // The width/height here are arbitrary canvas sizes used for calculation, 
    // we use the actual node bounds plus padding for the final image.
    const viewport = getViewportForBounds(
        nodesBounds,
        nodesBounds.width + padding * 2,
        nodesBounds.height + padding * 2,
        0.5, // min zoom
        2,   // max zoom
        padding
    );

    // 3. Configure html-to-image options
    const imageWidth = nodesBounds.width + padding * 2;
    const imageHeight = nodesBounds.height + padding * 2;

    const options = {
        backgroundColor,
        width: imageWidth,
        height: imageHeight,
        style: {
            width: `${imageWidth}px`,
            height: `${imageHeight}px`,
            // Force the transform to show all nodes without the user needing to manually zoom out
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
        },
        // Filter out React Flow handles/controls if desired by checking class names
        filter: (node: HTMLElement) => {
            if (node?.classList?.contains('react-flow__minimap')) return false;
            if (node?.classList?.contains('react-flow__controls')) return false;
            return true;
        }
    };

    // 4. Generate the image data URL
    let dataUrl = '';
    try {
        if (format === 'png') {
            dataUrl = await toPng(viewportElement, options);
        } else if (format === 'jpeg') {
            dataUrl = await toJpeg(viewportElement, { ...options, quality: 0.95 });
        } else if (format === 'svg') {
            dataUrl = await toSvg(viewportElement, options);
        }
    } catch (err) {
        console.error('Failed to generate image:', err);
        throw new Error(`Failed to generate ${format.toUpperCase()}`);
    }

    // 5. Trigger download
    const link = document.createElement('a');
    link.download = `${diagramName}.${format}`;
    link.href = dataUrl;
    link.click();
}
