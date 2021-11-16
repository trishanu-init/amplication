import { Injectable } from '@nestjs/common';
import { isEmpty } from 'lodash';
import { AppService } from '..';
import { INVALID_APP_ID } from '../app/app.service';
import { GithubService } from '../github/github.service';
import { BaseGitArgs } from './dto/args/BaseGitArgs';
import { CreateRepoArgs } from './dto/args/CreateRepoArgs';
import { GetReposListArgs } from './dto/args/GetReposListArgs';
import { EnumSourceControlService } from './dto/enums/EnumSourceControlService';
import { GitRepo } from './dto/objects/GitRepo';
import { GitUser } from './dto/objects/GitUser';
import { INVALID_SOURCE_CONTROL_ERROR } from './errors/InvalidSourceControlError';

@Injectable()
export class GitService {
  constructor(
    private readonly githubService: GithubService,
    private readonly appService: AppService
  ) {}
  async getReposOfUser(args: GetReposListArgs): Promise<GitRepo[]> {
    const app = await this.appService.app({ where: { id: args.appId } });

    if (isEmpty(app)) {
      throw new Error(INVALID_APP_ID);
    }

    if (isEmpty(app.githubToken)) {
      throw new Error(
        `Sync cannot be enabled since this app is not authorized with any GitHub repo. You should first complete the authorization process`
      );
    }
    switch (args.sourceControlService) {
      case EnumSourceControlService.Github:
        return await this.githubService.getUserRepos(app.githubToken);
      default:
        throw INVALID_SOURCE_CONTROL_ERROR;
    }
  }
  async createRepo(args: CreateRepoArgs): Promise<GitRepo> {
    const { input, appId, sourceControlService } = args;
    const app = await this.appService.app({ where: { id: appId } });
    const { githubToken } = app;

    switch (sourceControlService) {
      case EnumSourceControlService.Github:
        return this.githubService.createRepo({
          token: githubToken,
          input: input
        });
      default:
        throw INVALID_SOURCE_CONTROL_ERROR;
    }
  }

  async getUsername(args: BaseGitArgs): Promise<string> {
    const { appId, sourceControlService } = args;
    const app = await this.appService.app({ where: { id: appId } });
    const { githubToken } = app;
    switch (sourceControlService) {
      case EnumSourceControlService.Github:
        return (await this.githubService.getUser(githubToken)).username;
      default:
        throw INVALID_SOURCE_CONTROL_ERROR;
    }
  }
  async getUser(args: BaseGitArgs): Promise<GitUser> {
    const { appId, sourceControlService } = args;
    const app = await this.appService.app({ where: { id: appId } });
    const { githubToken } = app;
    switch (sourceControlService) {
      case EnumSourceControlService.Github:
        return await this.githubService.getUser(githubToken);
      default:
        throw INVALID_SOURCE_CONTROL_ERROR;
    }
  }
}
