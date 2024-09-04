import { PartialType } from '@nestjs/mapped-types';
import { Comment } from './create-comment.dto';

export class UpdateCommentDto extends PartialType(Comment) {}
