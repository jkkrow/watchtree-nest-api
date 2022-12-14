import { AggregateRoot } from '@nestjs/cqrs';

import { UserCreatedEvent } from '../events/impl/user-created.event';
import { UserUpdatedEvent } from '../events/impl/user-updated.event';
import { UserDeletedEvent } from '../events/impl/user-deleted.event';
import { Membership } from '../interfaces/user.interface';
import { UserType } from '../constants/user.constant';

export class User extends AggregateRoot {
  constructor(
    private readonly props: {
      readonly id: string;
      readonly type: UserType;
      readonly email: string;
      name: string;
      password: string;
      picture: string;
      verified: boolean;
      admin: boolean;
      membership: Membership | null;
    },
  ) {
    super();
  }

  get id() {
    return this.props.id;
  }

  get type() {
    return this.props.type;
  }

  get name() {
    return this.props.name;
  }

  get email() {
    return this.props.email;
  }

  get password() {
    return this.props.password;
  }

  get picture() {
    return this.props.picture;
  }

  get verified() {
    return this.props.verified;
  }

  get admin() {
    return this.props.admin;
  }

  get membership() {
    return this.props.membership ? { ...this.props.membership } : null;
  }

  create() {
    this.apply(new UserCreatedEvent(this.id, this.type, this.email));
  }

  delete() {
    this.apply(new UserDeletedEvent(this.id));
  }

  updateName(name: string) {
    this.props.name = name;
    this.apply(new UserUpdatedEvent(this.id, { name }));
  }

  updatePassword(password: string) {
    this.props.password = password;
    this.apply(new UserUpdatedEvent(this.id, { password }));
  }

  updatePicture(picture: string) {
    this.props.picture = picture;
    this.apply(new UserUpdatedEvent(this.id, { picture }));
  }

  updateMembership(membership: Membership | null) {
    this.props.membership = membership;
    this.apply(new UserUpdatedEvent(this.id, { membership }));
  }

  updateVerified(verified: boolean) {
    this.props.verified = verified;
    this.apply(new UserUpdatedEvent(this.id, { verified }));
  }

  updateAdmin(admin: boolean) {
    this.props.admin = admin;
    this.apply(new UserUpdatedEvent(this.id, { admin }));
  }
}
