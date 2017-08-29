import { CollectionObject } from "./collection-object.model";

export interface Review extends CollectionObject {
  tourId: string;
  bookingId: string;
  user: {
    id: string;
    firstName: string;
    middleName: string;
    lastName: string;
    email: string;
    contact: string;
    image: {
      id: string;
      url: string;
      name: string;
    };
  };
  createdAt: Date;
  rating: Number;
  comments: string;
  approved: boolean;
  deleted: boolean;
}
