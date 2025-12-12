### Some Notes

Source segments have 2 different data formats for resource optimization (normalization). A SourceSegment does not include metadata but SegmentWithMetadata does. When storing the segments we enrich (denormalize) the segments with source metadata. During data transmission we send the source metadata just once - obviously it's the same for every segment derived from a single source. 