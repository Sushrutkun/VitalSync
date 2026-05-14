package com.vitalsync

import org.apache.spark.sql.SparkSession

trait SparkSessionWrapper {

    val spark: SparkSession = SparkSession
      .builder()
      .appName("Build a DataFrame from Scratch")
      .master("local[*]")
      .getOrCreate()

}