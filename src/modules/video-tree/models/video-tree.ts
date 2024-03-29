import { AggregateRoot } from '@nestjs/cqrs';

import { NotFoundException, BadRequestException } from 'src/common/exceptions';
import { VideoTreeCreatedEvent } from '../events/impl/video-tree-created.event';
import { VideoTreeUpdatedEvent } from '../events/impl/video-tree-updated.event';
import { VideoTreeDeletedEvent } from '../events/impl/video-tree-deleted.event';
import { VideoNodeCreatedEvent } from '../events/impl/video-node-created.event';
import { VideoNodeUpdatedEvent } from '../events/impl/video-node-updated.event';
import { VideoNodeDeletedEvent } from '../events/impl/video-node-deleted.event';
import { UpdateVideoTreeProps } from '../interfaces/video-tree';
import { VideoNode, UpdateVideoNodeProps } from '../interfaces/video-node';
import { VideoTreeStatus } from '../constants/video-tree.contstant';

export class VideoTree extends AggregateRoot {
  constructor(
    private readonly props: {
      readonly id: string;
      readonly creatorId: string;
      title: string;
      description: string;
      categories: string[];
      thumbnail: string;
      defaultThumbnail: string;
      size: number;
      maxDuration: number;
      minDuration: number;
      status: VideoTreeStatus;
      editing: boolean;
      root: VideoNode;
    },
  ) {
    super();
  }

  get id() {
    return this.props.id;
  }

  get creatorId() {
    return this.props.creatorId;
  }

  get title() {
    return this.props.title;
  }

  get categories() {
    return [...this.props.categories];
  }

  get description() {
    return this.props.description;
  }

  get thumbnail() {
    return this.props.thumbnail;
  }

  get defaultThumbnail() {
    return this.props.defaultThumbnail;
  }

  get size() {
    return this.props.size;
  }

  get maxDuration() {
    return this.props.maxDuration;
  }

  get minDuration() {
    return this.props.minDuration;
  }

  get status() {
    return this.props.status;
  }

  get editing() {
    return this.props.editing;
  }

  get root(): VideoNode {
    return JSON.parse(JSON.stringify(this.props.root));
  }

  get nodes(): VideoNode[] {
    return JSON.parse(JSON.stringify(this.traverseNodes()));
  }

  create() {
    this.apply(new VideoTreeCreatedEvent(this.id, this.creatorId));
  }

  update(updates: UpdateVideoTreeProps) {
    for (const key in updates) {
      if (key === 'root' || updates[key] === undefined) continue;
      this.props[key] = updates[key];
    }

    if (updates['root'] !== undefined) {
      const savedNodes = this.traverseNodes();
      const newNodes = this.traverseNodes(updates.root as VideoNode);

      savedNodes.forEach((savedNode) => {
        newNodes.forEach((newNode) => {
          if (savedNode.id !== newNode.id) return;

          savedNode.label = newNode.label;
          savedNode.selectionTimeStart = newNode.selectionTimeStart;
          savedNode.selectionTimeEnd = newNode.selectionTimeEnd;
        });
      });
    }

    if (this.categories.length > 10) {
      throw new BadRequestException('Exceeded categories length (max: 10)');
    }

    this.validateCompletion();
    this.apply(new VideoTreeUpdatedEvent(this.id, this.creatorId, updates));
  }

  delete() {
    this.apply(new VideoTreeDeletedEvent(this.id, this.creatorId));
  }

  createNode(id: string, parentId: string) {
    const parentNode = this.findNodeById(parentId);

    if (!parentNode) {
      throw new NotFoundException('ParentNode not found');
    }

    if (parentNode.children.length >= 4) {
      throw new BadRequestException('Exceeded children length (max: 4)');
    }

    const node: VideoNode = {
      id,
      level: parentNode.level + 1,
      name: '',
      label: '',
      url: '',
      thumbnail: '',
      size: 0,
      duration: 0,
      selectionTimeStart: 0,
      selectionTimeEnd: 0,
      children: [],
    };

    parentNode.children.push(node);
    this.validateCompletion();

    const meta = { treeId: this.id, userId: this.creatorId };
    this.apply(new VideoNodeCreatedEvent(id, meta));
  }

  updateNode(id: string, updates: UpdateVideoNodeProps) {
    const videoNode = this.findNodeById(id);

    if (!videoNode) {
      throw new NotFoundException('VideoNode not found');
    }

    for (const key in updates) {
      if (updates[key] === undefined) continue;
      videoNode[key] = updates[key];
    }

    this.updateTotalSize();
    this.updateMinMaxDuration();
    this.validateCompletion();

    const level = videoNode.level;
    const meta = { treeId: this.id, userId: this.creatorId, level };
    this.apply(new VideoNodeUpdatedEvent(id, meta, updates));
  }

  deleteNode(id: string) {
    const deletedNode = this.findNodeById(id);
    const parentNode = this.findNodeByChildId(id);

    if (!deletedNode || !parentNode) {
      throw new NotFoundException('VideoNode not found');
    }

    parentNode.children = parentNode.children.filter(
      (child) => child.id !== id,
    );

    this.updateTotalSize();
    this.updateMinMaxDuration();
    this.validateCompletion();

    this.traverseNodes(deletedNode).forEach((node) => {
      const meta = { treeId: this.id, userId: this.creatorId, url: node.url };
      this.apply(new VideoNodeDeletedEvent(node.id, meta));
    });
  }

  private findNodeById(nodeId: string) {
    return this.traverseNodes().find((node) => node.id === nodeId);
  }

  private findNodeByChildId(nodeId: string) {
    return this.traverseNodes().find((node) =>
      node.children.find((child) => child.id === nodeId),
    );
  }

  private traverseNodes(root = this.props.root) {
    let currentNode = root;
    const queue: (typeof root)[] = [];
    const nodes: (typeof root)[] = [];

    while (currentNode) {
      nodes.push(currentNode);

      if (currentNode.children.length) {
        currentNode.children.forEach((child) => queue.push(child));
      }

      currentNode = queue.shift() as typeof root;
    }

    return nodes;
  }

  private updateTotalSize() {
    const nodes = this.traverseNodes();
    const filteredNodes: VideoNode[] = [];
    const seen: { [key: string]: boolean } = {};

    for (const node of nodes) {
      const duplicated = seen.hasOwnProperty(node.name);

      if (!duplicated) {
        filteredNodes.push(node);
        seen[node.name] = true;
      }
    }

    this.props.size = filteredNodes.reduce((acc, cur) => acc + cur.size, 0);
  }

  private updateMinMaxDuration() {
    const paths = this.getPaths();
    const possibleDurations = paths.map((path) =>
      path.reduce((acc, cur) => acc + cur.duration, 0),
    );

    this.props.maxDuration = Math.max(...possibleDurations);
    this.props.minDuration = Math.min(...possibleDurations);
  }

  private getPaths() {
    const paths: VideoNode[][] = [];

    const iterate = (currentNode: VideoNode, path: VideoNode[]) => {
      const newPath = path.concat(currentNode);

      if (currentNode.children.length) {
        return currentNode.children.forEach((child) => {
          iterate(child, newPath);
        });
      }

      paths.push(newPath);
    };

    iterate(this.props.root, []);

    return paths;
  }

  private validateCompletion() {
    const nodes = this.traverseNodes();
    const isTitleMissing = !this.title;
    const isNodeUrlMissing = !!nodes.find((node) => !node.url);

    if (isTitleMissing || isNodeUrlMissing) {
      this.props.editing = true;
    }
  }
}
