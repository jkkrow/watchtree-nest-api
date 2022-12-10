import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Redirect,
  Body,
  Param,
  Ip,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import { v4 as uuidv4 } from 'uuid';

import { Role } from 'src/auth/decorators/role.decorator';
import { RequestUserId } from 'src/auth/decorators/user.decorator';
import { Serialize } from 'src/common/interceptors/serialize.interceptor';
import { MessageResponse } from 'src/common/dtos/response/message.response';
import { RedirectResponse } from 'src/common/dtos/response/redirect.response';

import { CreateVideoTreeCommand } from '../commands/impl/create-video-tree.command';
import { UpdateVideoTreeCommand } from '../commands/impl/update-video-tree.command';
import { DeleteVideoTreeCommand } from '../commands/impl/delete-video-tree.command';
import { CreateVideoNodeCommand } from '../commands/impl/create-video-node.command';
import { UpdateVideoNodeCommand } from '../commands/impl/update-video-node.command';
import { DeleteVideoNodeCommand } from '../commands/impl/delete-video-node.command';
import { AddToFavoritesCommand } from '../commands/impl/add-to-favorites.command';
import { RemoveFromFavoritesCommand } from '../commands/impl/remove-from-favorites.command';

import { WatchVideoTreeQuery } from '../queries/impl/watch-video-tree.query';

import { UpdateVideoTreeRequest } from '../dtos/request/update-video-tree.request';
import { CreateVideoNodeRequest } from '../dtos/request/create-video-node.request';
import { CreateVideoNodeResponse } from '../dtos/response/create-video-node.response';
import { UpdateVideoNodeRequest } from '../dtos/request/update-video-node.request';

@ApiTags('VideoTrees')
@Controller('video-trees')
export class VideoTreeController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /* Create VideoTree */
  /*--------------------------------------------*/
  @Post()
  @Redirect()
  @Role('verified')
  @Serialize(RedirectResponse, { status: 302 })
  async createVideoTree(@RequestUserId() userId: string) {
    const id = uuidv4();
    const command = new CreateVideoTreeCommand(id, userId);
    await this.commandBus.execute(command);

    return { url: `/channels/current/video-trees/${id}` };
  }

  /* Update VideoTree */
  /*--------------------------------------------*/
  @Patch(':id')
  @Role('verified')
  @Serialize(MessageResponse)
  async updateVideoTree(
    @Body() updates: UpdateVideoTreeRequest,
    @Param('id') id: string,
    @RequestUserId() userId: string,
  ) {
    const command = new UpdateVideoTreeCommand(id, updates, userId);
    await this.commandBus.execute(command);

    return { message: 'VideoTree updated successfully' };
  }

  /* Delete VideoTree */
  /*--------------------------------------------*/
  @Delete(':id')
  @Role('verified')
  @Serialize(MessageResponse)
  async deleteVideoTree(
    @Param('id') id: string,
    @RequestUserId() userId: string,
  ) {
    const command = new DeleteVideoTreeCommand(id, userId);
    await this.commandBus.execute(command);

    return { message: 'VideoTree deleted successfully' };
  }

  /* Create VideoNode */
  /*--------------------------------------------*/
  @Post(':id/video-nodes')
  @Role('verified')
  @Serialize(CreateVideoNodeResponse, { status: 201 })
  async createVideoNode(
    @Body() { parentId }: CreateVideoNodeRequest,
    @Param('id') treeId: string,
    @RequestUserId() userId: string,
  ) {
    const id = uuidv4();
    const command = new CreateVideoNodeCommand(id, treeId, parentId, userId);
    await this.commandBus.execute(command);

    return { id };
  }

  /* Update VideoNode */
  /*--------------------------------------------*/
  @Patch(':id/video-nodes/:nodeId')
  @Role('verified')
  @Serialize(MessageResponse)
  async updateVideoNode(
    @Body() updates: UpdateVideoNodeRequest,
    @Param('id') treeId: string,
    @Param('nodeId') id: string,
    @RequestUserId() userId: string,
  ) {
    const command = new UpdateVideoNodeCommand(id, treeId, updates, userId);
    await this.commandBus.execute(command);

    return { message: 'VideoNode updated successfully' };
  }

  /* Delete VideoNode */
  /*--------------------------------------------*/
  @Delete(':id/video-nodes/:nodeId')
  @Role('verified')
  @Serialize(MessageResponse)
  async deleteVideoNode(
    @Param('id') treeId: string,
    @Param('nodeId') id: string,
    @RequestUserId() userId: string,
  ) {
    const command = new DeleteVideoNodeCommand(id, treeId, userId);
    await this.commandBus.execute(command);

    return { message: 'VideoNode deleted successfully' };
  }

  /* Add to favorites */
  /*--------------------------------------------*/
  @Post(':id/favorites')
  @Role('verified')
  @Serialize(MessageResponse, { status: 201 })
  async addToFavorites(
    @Param('id') id: string,
    @RequestUserId() userId: string,
  ) {
    const command = new AddToFavoritesCommand(id, userId);
    await this.commandBus.execute(command);

    return { message: 'Added to favorites successfully' };
  }

  /* Remove from VideoNode */
  /*--------------------------------------------*/
  @Delete(':id/favorites')
  @Role('verified')
  @Serialize(MessageResponse)
  async removeFromFavorites(
    @Param('id') id: string,
    @RequestUserId() userId: string,
  ) {
    const command = new RemoveFromFavoritesCommand(id, userId);
    await this.commandBus.execute(command);

    return { message: 'Removed from favorites successfully' };
  }

  /* Watch VideoTree */
  /*--------------------------------------------*/
  @Get(':id/watch')
  async watchVideoTree(
    @Param('id') id: string,
    @Ip() ip: string,
    @RequestUserId() userId?: string,
  ) {
    const query = new WatchVideoTreeQuery(id, ip, userId);
    const videoTree = await this.queryBus.execute(query);

    return { videoTree };
  }
}
